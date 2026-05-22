from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.user_legal_name import UserLegalName
from app.db.schemas.user_legal_name import (
    UserLegalNameCreate,
    UserLegalNameUpdate,
)


def create_user_legal_name(
    db: Session,
    payload: UserLegalNameCreate
) -> UserLegalName:
    legal_name = UserLegalName(**payload.model_dump())

    db.add(legal_name)
    db.commit()
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
    limit: int = 100
):
    return (
        db.query(UserLegalName)
        .offset(skip)
        .limit(limit)
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

    for field, value in update_data.items():
        setattr(legal_name, field, value)

    db.commit()
    db.refresh(legal_name)

    return legal_name


def delete_user_legal_name(
    db: Session,
    legal_name_id: UUID
) -> bool:
    legal_name = get_user_legal_name(db, legal_name_id)

    if not legal_name:
        return False

    db.delete(legal_name)
    db.commit()

    return True