import secrets
import hashlib

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.user_refresh_token import UserRefreshToken
from app.db.models.user_verification_token import UserVerificationToken
from app.db.models.enums.user_status import UserStatus
from app.db.models.enums.user_verification_token_type import (
    UserVerificationTokenType,
)
from app.db.schemas.user_auth import LoginRequest
from app.db.schemas.user import UserPasswordChange


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)


def verify_password(raw_password: str, password_hash: str) -> bool:
    return pwd_context.verify(raw_password, password_hash)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def authenticate_user(
    db: Session,
    payload: LoginRequest
) -> Optional[User]:
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return None

    if not verify_password(payload.password, user.password_hash):
        return None

    if user.status != UserStatus.ACTIVE:
        return None

    return user


def change_user_password(
    db: Session,
    user_id: UUID,
    payload: UserPasswordChange
) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    if not verify_password(payload.old_password, user.password_hash):
        return None

    user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(user)

    return user


def create_email_confirmation_token(
    db: Session,
    user: User,
    expires_hours: int = 24
) -> str:
    raw_token = secrets.token_urlsafe(32)

    token_record = UserVerificationToken(
        user_id=user.id,
        token_type=UserVerificationTokenType.EMAIL_CONFIRMATION,
        token=raw_token,
        expires_at=now_utc() + timedelta(hours=expires_hours)
    )

    db.add(token_record)
    db.commit()

    return raw_token


def confirm_email_token(
    db: Session,
    token: str
) -> Optional[User]:
    token_record = (
        db.query(UserVerificationToken)
        .filter(UserVerificationToken.token == token)
        .first()
    )

    if not token_record:
        return None

    if token_record.used_at is not None:
        return None

    if token_record.expires_at < now_utc():
        return None

    user = token_record.user
    user.status = UserStatus.ACTIVE
    token_record.used_at = now_utc()

    db.commit()
    db.refresh(user)

    return user


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

    user.status = UserStatus.INACTIVE

    for token in user.refresh_tokens:
        if token.revoked_at is None:
            token.revoked_at = now_utc()

    db.commit()
    db.refresh(user)

    return user