import secrets
import hashlib
import os
import json

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from urllib.parse import urlparse

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.orm import Session
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import options_to_json
from webauthn.helpers.base64url_to_bytes import base64url_to_bytes
from webauthn.helpers.bytes_to_base64url import bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
)

from app.db.models.ref.country import Country
from app.db.models.ref.role import Role
from app.db.models.ref.locale import Locale
from app.db.models.user import User
from app.db.models.user_passkey import UserPasskey
from app.db.models.user_refresh_token import UserRefreshToken
from app.db.models.user_verification_token import UserVerificationToken
from app.db.models.user_webauthn_challenge import UserWebAuthnChallenge
from app.db.schemas.user_auth import BootstrapAdminRequest, LoginRequest
from app.db.schemas.user import UserPasswordChange
from app.services.app_url_service import build_app_url


USER_STATUS_ACTIVE = "ACTIVE"
USER_STATUS_INACTIVE = "INACTIVE"
USER_STATUS_NEEDS_EMAIL_VERIFICATION = "NEEDS_EMAIL_VERIFICATION"
TOKEN_TYPE_EMAIL_CONFIRMATION = "EMAIL_CONFIRMATION"
TOKEN_TYPE_PASSWORD_RESET = "PASSWORD_RESET"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
EMAIL_CONFIRMATION_EXPIRE_HOURS = int(os.getenv("EMAIL_CONFIRMATION_EXPIRE_HOURS", "24"))
PASSWORD_RESET_EXPIRE_HOURS = int(os.getenv("PASSWORD_RESET_EXPIRE_HOURS", "1"))
APP_PUBLIC_URL = os.getenv("APP_PUBLIC_URL", "http://localhost:3000")
SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
BOOTSTRAP_STATUS_CACHE_SECONDS = int(os.getenv("BOOTSTRAP_STATUS_CACHE_SECONDS", "60"))
PASSKEY_RP_NAME = os.getenv("PASSKEY_RP_NAME", "LeaseMate")
PASSKEY_RP_ID = os.getenv("PASSKEY_RP_ID") or urlparse(APP_PUBLIC_URL).hostname or "localhost"
PASSKEY_ORIGIN = os.getenv("PASSKEY_ORIGIN", APP_PUBLIC_URL.rstrip("/"))
PASSKEY_CHALLENGE_EXPIRE_MINUTES = int(os.getenv("PASSKEY_CHALLENGE_EXPIRE_MINUTES", "5"))
SESSION_ACTIVITY_NOTIFY_SECONDS = int(os.getenv("SESSION_ACTIVITY_NOTIFY_SECONDS", "30"))
SESSION_ONLINE_SECONDS = int(os.getenv("SESSION_ONLINE_SECONDS", "60"))
SESSION_IDLE_SECONDS = int(os.getenv("SESSION_IDLE_SECONDS", "300"))
PASSKEY_CHALLENGE_REGISTRATION = "PASSKEY_REGISTRATION"
PASSKEY_CHALLENGE_AUTHENTICATION = "PASSKEY_AUTHENTICATION"
COUNTRY_HEADER_KEYS = (
    "cf-ipcountry",
    "x-vercel-ip-country",
    "cloudfront-viewer-country",
    "x-appengine-country",
    "x-country-code",
)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_admin_exists_cache: Optional[tuple[bool, datetime]] = None


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)


def generate_temporary_password() -> str:
    return f"T{secrets.token_urlsafe(12)}!"


def verify_password(raw_password: str, password_hash: str) -> bool:
    return pwd_context.verify(raw_password, password_hash)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def get_admin_role(db: Session) -> Optional[Role]:
    return db.query(Role).filter(Role.code == "ADMIN").first()


def admin_exists(db: Session) -> bool:
    return (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(Role.code == "ADMIN")
        .first()
        is not None
    )


def get_cached_admin_exists(db: Session) -> bool:
    global _admin_exists_cache

    cached_value = _admin_exists_cache
    if cached_value is not None:
        exists, cached_at = cached_value
        cache_age = now_utc() - cached_at
        if cache_age.total_seconds() < BOOTSTRAP_STATUS_CACHE_SECONDS:
            return exists

    exists = admin_exists(db)
    _admin_exists_cache = (exists, now_utc())
    return exists


def get_bootstrap_locales(db: Session) -> list[Locale]:
    return (
        db.query(Locale)
        .filter(Locale.is_active.is_(True))
        .order_by(Locale.sort_order, Locale.code)
        .all()
    )


def get_bootstrap_default_locale(db: Session, headers) -> tuple[str, Optional[str]]:
    country_alpha2 = _get_country_alpha2_from_headers(headers)

    if not country_alpha2:
        return "en", None

    country = (
        db.query(Country)
        .filter(Country.alpha2 == country_alpha2, Country.is_active.is_(True))
        .first()
    )

    if not country or not country.default_locale_code:
        return "en", country_alpha2

    locale_exists = (
        db.query(Locale)
        .filter(
            Locale.code == country.default_locale_code,
            Locale.is_active.is_(True),
        )
        .first()
        is not None
    )

    return (country.default_locale_code if locale_exists else "en", country_alpha2)


def _get_country_alpha2_from_headers(headers) -> Optional[str]:
    for header_key in COUNTRY_HEADER_KEYS:
        value = headers.get(header_key)
        if not value:
            continue

        country_alpha2 = value.strip().upper()
        if len(country_alpha2) == 2 and country_alpha2 != "XX":
            return country_alpha2

    return None


def set_admin_exists_cache(exists: bool) -> None:
    global _admin_exists_cache
    _admin_exists_cache = (exists, now_utc())


def create_access_token(user: User, session_id: Optional[UUID] = None) -> str:
    expires_at = now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.code if user.role else None,
        "token_version": user.token_version or 0,
        "exp": expires_at,
        "iat": now_utc(),
    }
    if session_id is not None:
        payload["session_id"] = str(session_id)

    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_session_id_from_access_token(token: str) -> Optional[UUID]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        session_id = payload.get("session_id")
    except JWTError:
        return None

    if not session_id:
        return None

    try:
        return UUID(session_id)
    except (TypeError, ValueError):
        return None


def _can_user_authenticate(user: User) -> bool:
    if user.status == USER_STATUS_INACTIVE:
        return False

    # Admin users must be able to log in after changing their email address so
    # they can complete SMTP/email verification and unlock system setup. Regular
    # users remain blocked until their email is verified.
    if user.status == USER_STATUS_NEEDS_EMAIL_VERIFICATION:
        return bool(user.role and user.role.code == "ADMIN")

    return user.status == USER_STATUS_ACTIVE


def get_user_from_access_token(db: Session, token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        token_version = int(payload.get("token_version", 0))
    except JWTError:
        return None
    except (TypeError, ValueError):
        return None

    if not user_id:
        return None

    user = db.query(User).filter(User.id == UUID(user_id)).first()

    if not user or not _can_user_authenticate(user):
        return None

    if token_version != (user.token_version or 0):
        return None

    # Access tokens are stateless, so remote device logout must be enforced by
    # binding each access token to the refresh-token session that created it.
    # If that session is revoked, expired, or missing, this access token is no
    # longer accepted even before the normal JWT expiration time.
    if not session_id:
        return None

    try:
        session_uuid = UUID(session_id)
    except (TypeError, ValueError):
        return None

    session = (
        db.query(UserRefreshToken)
        .filter(
            UserRefreshToken.id == session_uuid,
            UserRefreshToken.user_id == user.id,
        )
        .first()
    )

    if not session:
        return None

    if session.revoked_at is not None:
        return None

    if session.expires_at < now_utc():
        return None

    return user


def build_email_confirmation_url(token: str, request=None) -> str:
    return build_app_url(f"/confirm-email/{token}", request)


def build_password_reset_url(token: str, request=None) -> str:
    return build_app_url(f"/reset-password/{token}", request)


def invalidate_user_sessions(db: Session, user: User) -> None:
    # Password resets must invalidate already-issued access tokens and all
    # refresh-token sessions for this user. The token version check is what
    # rejects stateless JWT access tokens before their normal expiration time.
    current_time = now_utc()
    user.token_version = (user.token_version or 0) + 1

    active_refresh_tokens = (
        db.query(UserRefreshToken)
        .filter(
            UserRefreshToken.user_id == user.id,
            UserRefreshToken.revoked_at.is_(None),
        )
        .all()
    )

    for refresh_token in active_refresh_tokens:
        refresh_token.revoked_at = current_time


def bootstrap_admin_user(
    db: Session,
    payload: BootstrapAdminRequest
) -> User:
    if admin_exists(db):
        raise ValueError("Admin user already exists")

    admin_role = get_admin_role(db)
    if not admin_role:
        raise ValueError("ADMIN role is not seeded")

    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise ValueError("User email already exists")

    if payload.preferred_locale_code:
        locale_exists = (
            db.query(Locale)
            .filter(Locale.code == payload.preferred_locale_code)
            .first()
            is not None
        )
        if not locale_exists:
            raise ValueError("Preferred locale is not available")

    user = User(
        family_name=payload.family_name,
        given_name=payload.given_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role_id=admin_role.id,
        preferred_locale_code=payload.preferred_locale_code,
        status=USER_STATUS_ACTIVE,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    set_admin_exists_cache(True)

    return user


def authenticate_user_with_reason(
    db: Session,
    payload: LoginRequest
) -> tuple[Optional[User], Optional[str]]:
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return None, None

    if not verify_password(payload.password, user.password_hash):
        return None, None

    if user.status == USER_STATUS_INACTIVE:
        return None, "inactive"

    if (
        user.status == USER_STATUS_NEEDS_EMAIL_VERIFICATION
        and (not user.role or user.role.code != "ADMIN")
    ):
        return None, "email_not_verified"

    if not _can_user_authenticate(user):
        return None, None

    return user, None


def authenticate_user(
    db: Session,
    payload: LoginRequest
) -> Optional[User]:
    user, _reason = authenticate_user_with_reason(db, payload)
    return user


def change_user_password(
    db: Session,
    user_id: UUID,
    payload: UserPasswordChange,
    require_old_password: bool = True
) -> tuple[Optional[User], Optional[str]]:
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None, "not_found"

    has_old_password = bool(payload.old_password)

    if has_old_password and not verify_password(payload.old_password, user.password_hash):
        return None, "old_password_incorrect"

    if require_old_password and not has_old_password:
        return None, "old_password_incorrect"

    if verify_password(payload.new_password, user.password_hash):
        return None, "new_password_same_as_current"

    user.password_hash = hash_password(payload.new_password)
    user.password_must_change = False

    db.commit()
    db.refresh(user)

    return user, None


def list_user_login_sessions(db: Session, user_id: UUID) -> list[UserRefreshToken]:
    sessions = (
        db.query(UserRefreshToken)
        .filter(
            UserRefreshToken.user_id == user_id,
            UserRefreshToken.revoked_at.is_(None),
            UserRefreshToken.expires_at > now_utc(),
        )
        .order_by(
            UserRefreshToken.last_used_at.desc().nullslast(),
            UserRefreshToken.created_at.desc(),
        )
        .all()
    )

    seen_devices: set[tuple[str, str]] = set()
    deduped_sessions: list[UserRefreshToken] = []
    for session in sessions:
        device_key = (session.device_info or "", session.ip_address or "")
        if device_key in seen_devices:
            continue
        seen_devices.add(device_key)
        deduped_sessions.append(session)

    return deduped_sessions


def get_login_session_status(
    session: UserRefreshToken,
    is_connected: bool,
) -> str:
    if is_connected:
        return "online"

    if not session.last_used_at:
        return "offline"

    activity_age_seconds = (now_utc() - session.last_used_at).total_seconds()
    if activity_age_seconds <= SESSION_ONLINE_SECONDS:
        return "online"
    if activity_age_seconds <= SESSION_IDLE_SECONDS:
        return "idle"
    return "offline"


def touch_login_session_activity(
    db: Session,
    session_id: UUID,
    throttle_seconds: int = SESSION_ACTIVITY_NOTIFY_SECONDS,
) -> tuple[UserRefreshToken | None, bool]:
    session = (
        db.query(UserRefreshToken)
        .filter(UserRefreshToken.id == session_id)
        .first()
    )

    if not session or session.revoked_at is not None or session.expires_at < now_utc():
        return None, False

    current_time = now_utc()
    should_notify = (
        session.last_used_at is None
        or (current_time - session.last_used_at).total_seconds() >= throttle_seconds
    )
    session.last_used_at = current_time
    db.commit()
    db.refresh(session)
    return session, should_notify


def list_user_passkeys(db: Session, user_id: UUID) -> list[UserPasskey]:
    return (
        db.query(UserPasskey)
        .filter(UserPasskey.user_id == user_id, UserPasskey.is_active.is_(True))
        .order_by(UserPasskey.created_at.desc())
        .all()
    )


def _store_webauthn_challenge(
    db: Session,
    challenge: bytes,
    challenge_type: str,
    user_id: Optional[UUID] = None,
) -> UserWebAuthnChallenge:
    record = UserWebAuthnChallenge(
        user_id=user_id,
        challenge=bytes_to_base64url(challenge),
        challenge_type=challenge_type,
        expires_at=now_utc() + timedelta(minutes=PASSKEY_CHALLENGE_EXPIRE_MINUTES),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _consume_webauthn_challenge(
    db: Session,
    challenge: bytes,
    challenge_type: str,
    user_id: Optional[UUID] = None,
) -> Optional[UserWebAuthnChallenge]:
    query = db.query(UserWebAuthnChallenge).filter(
        UserWebAuthnChallenge.challenge == bytes_to_base64url(challenge),
        UserWebAuthnChallenge.challenge_type == challenge_type,
        UserWebAuthnChallenge.used_at.is_(None),
        UserWebAuthnChallenge.expires_at > now_utc(),
    )

    if user_id is not None:
        query = query.filter(UserWebAuthnChallenge.user_id == user_id)

    record = query.first()
    if not record:
        return None

    record.used_at = now_utc()
    db.commit()
    return record


def _challenge_from_credential_payload(credential_payload: dict) -> Optional[bytes]:
    try:
        client_data_json = credential_payload["response"]["clientDataJSON"]
        client_data = json.loads(base64url_to_bytes(client_data_json).decode("utf-8"))
        return base64url_to_bytes(client_data["challenge"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None


def create_passkey_registration_options(db: Session, user: User) -> dict:
    existing_passkeys = list_user_passkeys(db, user.id)
    options = generate_registration_options(
        rp_id=PASSKEY_RP_ID,
        rp_name=PASSKEY_RP_NAME,
        user_id=str(user.id).encode("utf-8"),
        user_name=user.email,
        user_display_name=f"{user.given_name} {user.family_name}".strip() or user.email,
        exclude_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(passkey.credential_id))
            for passkey in existing_passkeys
        ],
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    _store_webauthn_challenge(
        db,
        options.challenge,
        PASSKEY_CHALLENGE_REGISTRATION,
        user.id,
    )
    return json.loads(options_to_json(options))


def verify_passkey_registration(
    db: Session,
    user: User,
    credential_payload: dict,
    name: Optional[str] = None,
) -> tuple[Optional[UserPasskey], Optional[str]]:
    challenge = _challenge_from_credential_payload(credential_payload)
    if not challenge:
        return None, "invalid_challenge"

    challenge_record = _consume_webauthn_challenge(
        db,
        challenge,
        PASSKEY_CHALLENGE_REGISTRATION,
        user.id,
    )

    if not challenge_record:
        return None, "invalid_challenge"

    try:
        verification = verify_registration_response(
            credential=credential_payload,
            expected_challenge=base64url_to_bytes(challenge_record.challenge),
            expected_origin=PASSKEY_ORIGIN,
            expected_rp_id=PASSKEY_RP_ID,
            require_user_verification=False,
        )
    except Exception:
        return None, "verification_failed"

    credential_id = bytes_to_base64url(verification.credential_id)
    existing = (
        db.query(UserPasskey)
        .filter(UserPasskey.credential_id == credential_id)
        .first()
    )
    if existing:
        return None, "credential_exists"

    response_payload = credential_payload.get("response", {})
    transports = (
        response_payload.get("transports")
        if isinstance(response_payload, dict)
        else None
    ) or credential_payload.get("transports")
    passkey = UserPasskey(
        user_id=user.id,
        credential_id=credential_id,
        credential_public_key=bytes_to_base64url(verification.credential_public_key),
        sign_count=verification.sign_count,
        name=(name or "Passkey")[:100],
        device_type=str(verification.credential_device_type or ""),
        backed_up=bool(verification.credential_backed_up),
        transports=",".join(transports or []) if transports else None,
        is_active=True,
    )
    db.add(passkey)
    db.commit()
    db.refresh(passkey)
    return passkey, None


def create_passkey_authentication_options(
    db: Session,
    email: Optional[str] = None,
) -> dict:
    query = db.query(UserPasskey).filter(UserPasskey.is_active.is_(True))

    if email:
        normalized_email = email.strip().lower()
        query = query.join(User).filter(func.lower(User.email) == normalized_email)

    passkeys = query.all()
    options = generate_authentication_options(
        rp_id=PASSKEY_RP_ID,
        allow_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(passkey.credential_id))
            for passkey in passkeys
        ],
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    _store_webauthn_challenge(
        db,
        options.challenge,
        PASSKEY_CHALLENGE_AUTHENTICATION,
    )
    return json.loads(options_to_json(options))


def authenticate_user_with_passkey(
    db: Session,
    credential_payload: dict,
) -> tuple[Optional[User], Optional[str]]:
    credential_id = credential_payload.get("id")
    if not credential_id:
        return None, "credential_not_found"

    passkey = (
        db.query(UserPasskey)
        .filter(
            UserPasskey.credential_id == credential_id,
            UserPasskey.is_active.is_(True),
        )
        .first()
    )

    if not passkey:
        return None, "credential_not_found"

    challenge = _challenge_from_credential_payload(credential_payload)
    if not challenge:
        return None, "invalid_challenge"

    challenge_record = _consume_webauthn_challenge(
        db,
        challenge,
        PASSKEY_CHALLENGE_AUTHENTICATION,
    )

    if not challenge_record:
        return None, "invalid_challenge"

    try:
        verification = verify_authentication_response(
            credential=credential_payload,
            expected_challenge=base64url_to_bytes(challenge_record.challenge),
            expected_origin=PASSKEY_ORIGIN,
            expected_rp_id=PASSKEY_RP_ID,
            credential_public_key=base64url_to_bytes(passkey.credential_public_key),
            credential_current_sign_count=passkey.sign_count,
            require_user_verification=False,
        )
    except Exception:
        return None, "verification_failed"

    user = passkey.user
    if (
        not user
        or user.status != USER_STATUS_ACTIVE
        or user.email_verified_at is None
    ):
        return None, "user_not_available"

    passkey.sign_count = verification.new_sign_count
    passkey.last_used_at = now_utc()
    db.commit()
    db.refresh(user)
    return user, None


def delete_user_passkey(
    db: Session,
    user_id: UUID,
    passkey_id: UUID,
) -> bool:
    passkey = (
        db.query(UserPasskey)
        .filter(UserPasskey.id == passkey_id, UserPasskey.user_id == user_id)
        .first()
    )
    if not passkey:
        return False

    passkey.is_active = False
    db.commit()
    return True


def revoke_user_session(
    db: Session,
    user_id: UUID,
    session_id: UUID,
) -> list[UUID]:
    session = (
        db.query(UserRefreshToken)
        .filter(UserRefreshToken.id == session_id, UserRefreshToken.user_id == user_id)
        .first()
    )
    if not session:
        return []

    current_time = now_utc()
    grouped_sessions = (
        db.query(UserRefreshToken)
        .filter(
            UserRefreshToken.user_id == user_id,
            UserRefreshToken.device_info == session.device_info,
            UserRefreshToken.ip_address == session.ip_address,
            UserRefreshToken.revoked_at.is_(None),
        )
        .all()
    )

    revoked_session_ids = []
    for grouped_session in grouped_sessions:
        grouped_session.revoked_at = current_time
        revoked_session_ids.append(grouped_session.id)

    db.commit()
    return revoked_session_ids


def revoke_other_user_sessions(
    db: Session,
    user: User,
    raw_current_refresh_token: Optional[str],
) -> list[UUID]:
    current_hash = hash_token(raw_current_refresh_token) if raw_current_refresh_token else None
    sessions = (
        db.query(UserRefreshToken)
        .filter(
            UserRefreshToken.user_id == user.id,
            UserRefreshToken.revoked_at.is_(None),
        )
        .all()
    )

    revoked_session_ids = []
    for session in sessions:
        if current_hash and session.token_hash == current_hash:
            continue
        session.revoked_at = now_utc()
        revoked_session_ids.append(session.id)

    db.commit()
    return revoked_session_ids


def create_email_confirmation_token(
    db: Session,
    user: User,
    expires_hours: int = 24
) -> tuple[str, UserRefreshToken]:
    raw_token = secrets.token_urlsafe(32)

    token_record = UserVerificationToken(
        user_id=user.id,
        token_type=TOKEN_TYPE_EMAIL_CONFIRMATION,
        token=raw_token,
        expires_at=now_utc() + timedelta(hours=expires_hours)
    )

    db.add(token_record)
    db.commit()

    return raw_token


def create_email_confirmation_token_record(
    db: Session,
    user: User,
    expires_hours: int = 24
) -> tuple[UserVerificationToken, str]:
    raw_token = create_email_confirmation_token(db, user, expires_hours)
    token_record = (
        db.query(UserVerificationToken)
        .filter(UserVerificationToken.token == raw_token)
        .first()
    )

    return token_record, raw_token


def expire_active_email_confirmation_tokens_for_user(
    db: Session,
    user_id: UUID,
) -> int:
    current_time = now_utc()
    tokens = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.user_id == user_id,
            UserVerificationToken.token_type == TOKEN_TYPE_EMAIL_CONFIRMATION,
            UserVerificationToken.used_at.is_(None),
            UserVerificationToken.expires_at > current_time,
        )
        .all()
    )

    for token in tokens:
        token.expires_at = current_time

    db.commit()
    return len(tokens)


def create_replacement_email_confirmation_token_record(
    db: Session,
    user: User,
    expires_hours: int = 24,
) -> tuple[UserVerificationToken, str]:
    expire_active_email_confirmation_tokens_for_user(db, user.id)
    return create_email_confirmation_token_record(db, user, expires_hours)


def get_active_email_confirmation_tokens(db: Session) -> list[UserVerificationToken]:
    return (
        db.query(UserVerificationToken)
        .join(User, UserVerificationToken.user_id == User.id)
        .filter(
            UserVerificationToken.token_type == TOKEN_TYPE_EMAIL_CONFIRMATION,
            UserVerificationToken.used_at.is_(None),
            UserVerificationToken.expires_at > now_utc(),
            User.email_verified_at.is_(None),
        )
        .order_by(UserVerificationToken.expires_at, User.email)
        .all()
    )


def get_active_email_confirmation_token(
    db: Session,
    token_id: UUID,
) -> Optional[UserVerificationToken]:
    return (
        db.query(UserVerificationToken)
        .join(User, UserVerificationToken.user_id == User.id)
        .filter(
            UserVerificationToken.id == token_id,
            UserVerificationToken.token_type == TOKEN_TYPE_EMAIL_CONFIRMATION,
            UserVerificationToken.used_at.is_(None),
            UserVerificationToken.expires_at > now_utc(),
            User.email_verified_at.is_(None),
        )
        .first()
    )


def expire_email_confirmation_token(
    db: Session,
    token_id: UUID
) -> Optional[UserVerificationToken]:
    token_record = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.id == token_id,
            UserVerificationToken.token_type == TOKEN_TYPE_EMAIL_CONFIRMATION,
            UserVerificationToken.used_at.is_(None),
            UserVerificationToken.expires_at > now_utc(),
        )
        .first()
    )

    if not token_record:
        return None

    token_record.expires_at = now_utc()
    db.commit()
    db.refresh(token_record)

    return token_record


def get_email_link_dashboard_stats(db: Session) -> dict[str, int]:
    current_time = now_utc()
    attention_cutoff = current_time - timedelta(days=7)
    expiring_cutoff = current_time + timedelta(hours=24)
    active_filters = (
        UserVerificationToken.token_type == TOKEN_TYPE_EMAIL_CONFIRMATION,
        UserVerificationToken.used_at.is_(None),
        UserVerificationToken.expires_at > current_time,
        User.email_verified_at.is_(None),
    )

    active_link_count = (
        db.query(UserVerificationToken)
        .join(User, UserVerificationToken.user_id == User.id)
        .filter(*active_filters)
        .count()
    )
    expiring_today_count = (
        db.query(UserVerificationToken)
        .join(User, UserVerificationToken.user_id == User.id)
        .filter(*active_filters, UserVerificationToken.expires_at <= expiring_cutoff)
        .count()
    )
    attention_required_count = (
        db.query(User)
        .filter(
            User.email_verified_at.is_(None),
            User.created_at <= attention_cutoff,
        )
        .count()
    )

    return {
        "active_link_count": active_link_count,
        "attention_required_count": attention_required_count,
        "expiring_today_count": expiring_today_count,
    }


def expire_active_password_reset_tokens_for_user(
    db: Session,
    user_id: UUID,
) -> int:
    current_time = now_utc()
    tokens = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.user_id == user_id,
            UserVerificationToken.token_type == TOKEN_TYPE_PASSWORD_RESET,
            UserVerificationToken.used_at.is_(None),
            UserVerificationToken.expires_at > current_time,
        )
        .all()
    )

    for token in tokens:
        token.expires_at = current_time

    db.commit()
    return len(tokens)


def create_password_reset_token_record(
    db: Session,
    user: User,
    expires_hours: int = PASSWORD_RESET_EXPIRE_HOURS,
) -> tuple[UserVerificationToken, str]:
    raw_token = secrets.token_urlsafe(32)
    token_record = UserVerificationToken(
        user_id=user.id,
        token_type=TOKEN_TYPE_PASSWORD_RESET,
        token=raw_token,
        expires_at=now_utc() + timedelta(hours=expires_hours),
    )

    db.add(token_record)
    db.commit()
    db.refresh(token_record)

    return token_record, raw_token


def create_password_reset_for_verified_email(
    db: Session,
    email: str,
) -> tuple[Optional[User], Optional[UserVerificationToken], Optional[str]]:
    normalized_email = email.strip().lower()
    user = (
        db.query(User)
        .filter(func.lower(User.email) == normalized_email)
        .first()
    )

    if (
        not user
        or user.status != USER_STATUS_ACTIVE
        or user.email_verified_at is None
    ):
        return None, None, None

    expire_active_password_reset_tokens_for_user(db, user.id)
    token_record, raw_token = create_password_reset_token_record(db, user)

    return user, token_record, raw_token


def get_password_reset_token_status(
    db: Session,
    token: str,
) -> tuple[Optional[User], str]:
    token_record = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.token == token,
            UserVerificationToken.token_type == TOKEN_TYPE_PASSWORD_RESET,
        )
        .first()
    )

    if not token_record:
        return None, "invalid"

    if token_record.used_at is not None:
        return None, "used"

    if token_record.expires_at < now_utc():
        return None, "expired"

    user = token_record.user
    if (
        not user
        or user.status != USER_STATUS_ACTIVE
        or user.email_verified_at is None
    ):
        return None, "not_available"

    return user, "valid"


def reset_password_with_token(
    db: Session,
    token: str,
    new_password: str,
) -> tuple[Optional[User], Optional[str]]:
    user, token_status = get_password_reset_token_status(db, token)

    if not user:
        return None, token_status

    if verify_password(new_password, user.password_hash):
        return None, "new_password_same_as_current"

    token_record = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.token == token,
            UserVerificationToken.token_type == TOKEN_TYPE_PASSWORD_RESET,
            UserVerificationToken.used_at.is_(None),
        )
        .first()
    )

    if not token_record:
        return None, "invalid"

    user.password_hash = hash_password(new_password)
    user.password_must_change = False
    token_record.used_at = now_utc()
    invalidate_user_sessions(db, user)

    current_time = now_utc()
    sibling_tokens = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.user_id == user.id,
            UserVerificationToken.token_type == TOKEN_TYPE_PASSWORD_RESET,
            UserVerificationToken.used_at.is_(None),
            UserVerificationToken.expires_at > current_time,
            UserVerificationToken.id != token_record.id,
        )
        .all()
    )

    for sibling_token in sibling_tokens:
        sibling_token.expires_at = current_time

    db.commit()
    db.refresh(user)

    return user, None


def confirm_email_token(
    db: Session,
    token: str
) -> tuple[Optional[User], str]:
    token_record = (
        db.query(UserVerificationToken)
        .filter(
            UserVerificationToken.token == token,
            UserVerificationToken.token_type == TOKEN_TYPE_EMAIL_CONFIRMATION,
        )
        .first()
    )

    if not token_record:
        return None, "invalid"

    if token_record.used_at is not None:
        return token_record.user, "used"

    if token_record.expires_at < now_utc():
        return None, "expired"

    user = token_record.user
    user.email_verified_at = now_utc()
    user.status = USER_STATUS_ACTIVE
    token_record.used_at = now_utc()

    db.commit()
    db.refresh(user)

    return user, "confirmed"


def create_refresh_token(
    db: Session,
    user: User,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
    location_country_code: Optional[str] = None,
    location_region: Optional[str] = None,
    location_city: Optional[str] = None,
    expires_days: int = 30,
) -> str:
    raw_token = secrets.token_urlsafe(64)
    current_time = now_utc()

    db.query(UserRefreshToken).filter(
        UserRefreshToken.user_id == user.id,
        UserRefreshToken.device_info == device_info,
        UserRefreshToken.ip_address == ip_address,
        UserRefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": current_time}, synchronize_session=False)

    refresh_token = UserRefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=current_time + timedelta(days=expires_days),
        device_info=device_info,
        ip_address=ip_address,
        location_country_code=location_country_code,
        location_region=location_region,
        location_city=location_city,
        last_used_at=current_time,
    )

    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)

    return raw_token, refresh_token


def issue_login_tokens(
    db: Session,
    user: User,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
    location_country_code: Optional[str] = None,
    location_region: Optional[str] = None,
    location_city: Optional[str] = None,
) -> tuple[str, str]:
    refresh_token, refresh_token_record = create_refresh_token(
        db,
        user,
        device_info=device_info,
        ip_address=ip_address,
        location_country_code=location_country_code,
        location_region=location_region,
        location_city=location_city,
    )
    access_token = create_access_token(user, refresh_token_record.id)

    return access_token, refresh_token


def create_access_token_from_refresh_token(
    db: Session,
    raw_token: str
) -> Optional[str]:
    token_hash = hash_token(raw_token)

    refresh_token = (
        db.query(UserRefreshToken)
        .filter(UserRefreshToken.token_hash == token_hash)
        .first()
    )

    if not refresh_token:
        return None

    if refresh_token.revoked_at is not None:
        return None

    if refresh_token.expires_at < now_utc():
        return None

    if not _can_user_authenticate(refresh_token.user):
        return None

    refresh_token.last_used_at = now_utc()
    db.commit()

    return create_access_token(refresh_token.user, refresh_token.id)


def revoke_refresh_token(
    db: Session,
    raw_token: str
) -> tuple[UUID, UUID] | None:
    token_hash = hash_token(raw_token)

    refresh_token = (
        db.query(UserRefreshToken)
        .filter(UserRefreshToken.token_hash == token_hash)
        .first()
    )

    if not refresh_token:
        return None

    refresh_token.revoked_at = now_utc()
    user_id = refresh_token.user_id
    session_id = refresh_token.id
    db.commit()

    return user_id, session_id


def deactivate_user(
    db: Session,
    user_id: UUID
) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    user.status = USER_STATUS_INACTIVE

    for token in user.refresh_tokens:
        if token.revoked_at is None:
            token.revoked_at = now_utc()

    db.commit()
    db.refresh(user)

    return user


def activate_user(
    db: Session,
    user_id: UUID
) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    user.status = (
        USER_STATUS_ACTIVE
        if user.email_verified_at is not None
        else USER_STATUS_NEEDS_EMAIL_VERIFICATION
    )

    db.commit()
    db.refresh(user)

    return user
