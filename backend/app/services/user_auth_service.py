import secrets
import hashlib
import os

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.models.ref.role import Role
from app.db.models.ref.locale import Locale
from app.db.models.user import User
from app.db.models.user_refresh_token import UserRefreshToken
from app.db.models.user_verification_token import UserVerificationToken
from app.db.schemas.user_auth import BootstrapAdminRequest, LoginRequest
from app.db.schemas.user import UserPasswordChange


USER_STATUS_ACTIVE = "ACTIVE"
USER_STATUS_INACTIVE = "INACTIVE"
USER_STATUS_NEEDS_EMAIL_VERIFICATION = "NEEDS_EMAIL_VERIFICATION"
TOKEN_TYPE_EMAIL_CONFIRMATION = "EMAIL_CONFIRMATION"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
EMAIL_CONFIRMATION_EXPIRE_HOURS = int(os.getenv("EMAIL_CONFIRMATION_EXPIRE_HOURS", "24"))
APP_PUBLIC_URL = os.getenv("APP_PUBLIC_URL", "http://localhost:3000")
SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
BOOTSTRAP_STATUS_CACHE_SECONDS = int(os.getenv("BOOTSTRAP_STATUS_CACHE_SECONDS", "60"))


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


def set_admin_exists_cache(exists: bool) -> None:
    global _admin_exists_cache
    _admin_exists_cache = (exists, now_utc())


def create_access_token(user: User) -> str:
    expires_at = now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.code if user.role else None,
        "exp": expires_at,
        "iat": now_utc(),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_user_from_access_token(db: Session, token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        return None

    if not user_id:
        return None

    return (
        db.query(User)
        .filter(User.id == UUID(user_id), User.status == USER_STATUS_ACTIVE)
        .first()
    )


def build_email_confirmation_url(token: str) -> str:
    return f"{APP_PUBLIC_URL.rstrip('/')}/confirm-email/{token}"


def bootstrap_admin_user(
    db: Session,
    payload: BootstrapAdminRequest
) -> tuple[User, UserVerificationToken, str]:
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

    token_record, raw_token = create_email_confirmation_token_record(
        db,
        user,
        EMAIL_CONFIRMATION_EXPIRE_HOURS,
    )

    return user, token_record, raw_token


def authenticate_user(
    db: Session,
    payload: LoginRequest
) -> Optional[User]:
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return None

    if not verify_password(payload.password, user.password_hash):
        return None

    if user.status != USER_STATUS_ACTIVE:
        return None

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

    if require_old_password and (
        not payload.old_password
        or not verify_password(payload.old_password, user.password_hash)
    ):
        return None, "old_password_incorrect"

    if require_old_password and verify_password(payload.new_password, user.password_hash):
        return None, "new_password_same_as_current"

    user.password_hash = hash_password(payload.new_password)
    user.password_must_change = False

    db.commit()
    db.refresh(user)

    return user, None


def create_email_confirmation_token(
    db: Session,
    user: User,
    expires_hours: int = 24
) -> str:
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


def confirm_email_token(
    db: Session,
    token: str
) -> tuple[Optional[User], str]:
    token_record = (
        db.query(UserVerificationToken)
        .filter(UserVerificationToken.token == token)
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
    expires_days: int = 30
) -> str:
    raw_token = secrets.token_urlsafe(64)

    refresh_token = UserRefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=now_utc() + timedelta(days=expires_days),
        device_info=device_info,
        ip_address=ip_address,
        last_used_at=now_utc()
    )

    db.add(refresh_token)
    db.commit()

    return raw_token


def issue_login_tokens(
    db: Session,
    user: User,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None
) -> tuple[str, str]:
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(
        db,
        user,
        device_info=device_info,
        ip_address=ip_address,
    )

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

    if refresh_token.user.status != USER_STATUS_ACTIVE:
        return None

    refresh_token.last_used_at = now_utc()
    db.commit()

    return create_access_token(refresh_token.user)


def revoke_refresh_token(
    db: Session,
    raw_token: str
) -> bool:
    token_hash = hash_token(raw_token)

    refresh_token = (
        db.query(UserRefreshToken)
        .filter(UserRefreshToken.token_hash == token_hash)
        .first()
    )

    if not refresh_token:
        return False

    refresh_token.revoked_at = now_utc()
    db.commit()

    return True


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
