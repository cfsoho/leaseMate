from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.schemas.user import UserCreate, UserUpdate
from app.services.user_auth_service import hash_password

from app.services.soft_delete import soft_delete

def create_user(db: Session, payload: UserCreate) -> User:
    data = payload.model_dump()
    raw_password = data.pop("password")

    user = User(
        **data,
        password_hash=hash_password(raw_password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def update_user(
    db: Session,
    user_id: UUID,
    payload: UserUpdate
) -> Optional[User]:
    user = get_user(db, user_id)

    if not user:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    user = get_user(db, user_id)

    if not user:
        return False
    soft_delete(db, user, deleted_by)

    return True