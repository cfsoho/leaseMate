from uuid import UUID
from typing import Optional

from sqlalchemy import asc, case, desc
from sqlalchemy.orm import Session

from app.db.models.ref.role import Role
from app.db.models.user import User
from app.db.schemas.user import UserCreate, UserUpdate
from app.services.user_auth_service import (
    USER_STATUS_NEEDS_EMAIL_VERIFICATION,
    generate_temporary_password,
    hash_password,
)

from app.services.soft_delete import soft_delete

DEFAULT_CREATED_USER_ROLE = "USER"


def get_default_created_user_role_id(db: Session) -> UUID:
    role = db.query(Role).filter(Role.code == DEFAULT_CREATED_USER_ROLE).first()

    if not role:
        raise ValueError("USER role is not seeded")

    return role.id


def create_user(
    db: Session,
    payload: UserCreate,
    created_by_user_id: Optional[UUID] = None,
) -> tuple[User, Optional[str]]:
    data = payload.model_dump()
    raw_password = data.pop("password") or generate_temporary_password()
    data.pop("role_id", None)
    data["role_id"] = get_default_created_user_role_id(db)
    data["status"] = USER_STATUS_NEEDS_EMAIL_VERIFICATION
    data["created_by_user_id"] = created_by_user_id
    password_must_change = payload.password is None

    user = User(
        **data,
        password_hash=hash_password(raw_password),
        password_must_change=password_must_change,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user, raw_password if password_must_change else None


def get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    created_by_user_id: Optional[UUID] = None,
):
    query = db.query(User).filter(User.is_deleted.is_(False))

    if created_by_user_id:
        query = query.filter(User.created_by_user_id == created_by_user_id)

    return (
        query
        .order_by(asc(User.family_name), asc(User.given_name), asc(User.email))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_users_page(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "created_at",
    sort_direction: str = "asc",
    exclude_user_id: Optional[UUID] = None,
    family_name: Optional[str] = None,
    given_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    preferred_locale_code: Optional[str] = None,
) -> tuple[list[User], int]:
    query = db.query(User).filter(User.is_deleted.is_(False))

    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)

    if family_name:
        query = query.filter(User.family_name.ilike(f"%{family_name}%"))

    if given_name:
        query = query.filter(User.given_name.ilike(f"%{given_name}%"))

    if email:
        query = query.filter(User.email.ilike(f"%{email}%"))

    if phone:
        query = query.filter(User.phone.ilike(f"%{phone}%"))

    if preferred_locale_code:
        query = query.filter(User.preferred_locale_code == preferred_locale_code)

    total = query.count()
    order_direction = desc if sort_direction == "desc" else asc

    status_bucket = case(
        (User.status == "INACTIVE", 1),
        else_=0,
    )

    if sort_by == "name":
        order_columns = [
            order_direction(User.family_name),
            order_direction(User.given_name),
        ]
    else:
        sort_columns = {
            "email": User.email,
            "preferred_locale": User.preferred_locale_code,
            "status": User.status,
            "email_verified": User.email_verified_at,
            "created_at": User.created_at,
        }
        sort_column = sort_columns.get(sort_by, User.created_at)
        order_columns = [order_direction(sort_column)]

    offset = (page - 1) * page_size
    users = (
        query
        .order_by(asc(status_bucket), *order_columns, asc(User.id))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return users, total


def update_user(
    db: Session,
    user_id: UUID,
    payload: UserUpdate
) -> Optional[User]:
    user = get_user(db, user_id)

    if not user:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("role_id", None)

    next_email = update_data.get("email")
    if next_email and next_email != user.email:
        existing_user = get_user_by_email(db, next_email)
        if existing_user and existing_user.id != user.id:
            raise ValueError("Email is already used by another user")

        user.email_verified_at = None
        user.status = USER_STATUS_NEEDS_EMAIL_VERIFICATION

    for field, value in update_data.items():
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
