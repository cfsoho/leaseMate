from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.user_legal_name import UserLegalName
from app.db.schemas.user_legal_name import (
    UserLegalNameCreate,
    UserLegalNameUpdate,
)

from app.services.soft_delete import soft_delete


LEGAL_NAME_DUPLICATE_MESSAGE = (
    "This exact legal name already exists for this country and language."
)
def _find_matching_legal_name(
    db: Session,
    user_id: UUID,
    country_id: UUID,
    locale_code: str,
    full_name: Optional[str] = None,
    is_deleted: Optional[bool] = None,
    exclude_id: Optional[UUID] = None,
) -> Optional[UserLegalName]:
    query = db.query(UserLegalName).filter(
        UserLegalName.user_id == user_id,
        UserLegalName.country_id == country_id,
        UserLegalName.locale_code == locale_code,
    )

    if full_name is not None:
        query = query.filter(UserLegalName.full_name == full_name)

    if is_deleted is not None:
        query = query.filter(UserLegalName.is_deleted.is_(is_deleted))

    if exclude_id:
        query = query.filter(UserLegalName.id != exclude_id)

    return query.order_by(UserLegalName.is_deleted.asc()).first()


def get_inactive_user_legal_name_match(
    db: Session,
    user_id: UUID,
    country_id: UUID,
    locale_code: str,
) -> Optional[UserLegalName]:
    legal_name = _find_matching_legal_name(
        db,
        user_id,
        country_id,
        locale_code,
        is_deleted=True,
    )

    return legal_name


def create_user_legal_name(
    db: Session,
    payload: UserLegalNameCreate
) -> UserLegalName:
    active_legal_name = _find_matching_legal_name(
        db,
        payload.user_id,
        payload.country_id,
        payload.locale_code,
        payload.full_name,
        is_deleted=False,
    )

    if active_legal_name:
        raise ValueError(LEGAL_NAME_DUPLICATE_MESSAGE)

    deleted_legal_name = _find_matching_legal_name(
        db,
        payload.user_id,
        payload.country_id,
        payload.locale_code,
        payload.full_name,
        is_deleted=True,
    )

    if deleted_legal_name:
        deleted_legal_name.is_deleted = False
        deleted_legal_name.deleted_at = None
        deleted_legal_name.deleted_by = None
        deleted_legal_name.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(deleted_legal_name)
        return deleted_legal_name

    legal_name = UserLegalName(**payload.model_dump())

    db.add(legal_name)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError(LEGAL_NAME_DUPLICATE_MESSAGE) from error

    db.refresh(legal_name)

    return legal_name


def get_user_legal_name(
    db: Session,
    legal_name_id: UUID
) -> Optional[UserLegalName]:
    return (
        db.query(UserLegalName)
        .filter(UserLegalName.id == legal_name_id)
        .first()
    )


def get_user_legal_names(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
):
    query = db.query(UserLegalName).filter(UserLegalName.is_deleted.is_(False))

    if user_id:
        query = query.filter(UserLegalName.user_id == user_id)

    return query.order_by(UserLegalName.created_at, UserLegalName.id).offset(skip).limit(limit).all()


def get_user_legal_names_for_user(
    db: Session,
    user_id: UUID
):
    return (
        db.query(UserLegalName)
        .filter(
            UserLegalName.user_id == user_id,
            UserLegalName.is_deleted.is_(False),
        )
        .order_by(UserLegalName.created_at, UserLegalName.id)
        .all()
    )


def update_user_legal_name(
    db: Session,
    legal_name_id: UUID,
    payload: UserLegalNameUpdate
) -> Optional[UserLegalName]:
    legal_name = get_user_legal_name(db, legal_name_id)

    if not legal_name:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    next_country_id = update_data.get("country_id", legal_name.country_id)
    next_locale_code = update_data.get("locale_code", legal_name.locale_code)
    next_full_name = update_data.get("full_name", legal_name.full_name)
    existing_legal_name = _find_matching_legal_name(
        db,
        legal_name.user_id,
        next_country_id,
        next_locale_code,
        next_full_name,
        is_deleted=False,
        exclude_id=legal_name.id,
    )

    if existing_legal_name:
        raise ValueError(LEGAL_NAME_DUPLICATE_MESSAGE)

    for field, value in update_data.items():
        setattr(legal_name, field, value)

    if legal_name.is_deleted:
        legal_name.is_deleted = False
        legal_name.deleted_at = None
        legal_name.deleted_by = None

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError(LEGAL_NAME_DUPLICATE_MESSAGE) from error

    db.refresh(legal_name)

    return legal_name


def delete_user_legal_name(
    db: Session,
    legal_name_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    legal_name = get_user_legal_name(db, legal_name_id)

    if not legal_name:
        return False
    soft_delete(db, legal_name, deleted_by)

    return True
