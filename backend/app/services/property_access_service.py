from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.property_access import PropertyAccess
from app.db.schemas.property_access import (
    PropertyAccessCreate,
    PropertyAccessUpdate,
)


def create_property_access(
    db: Session,
    payload: PropertyAccessCreate
) -> PropertyAccess:
    access = PropertyAccess(**payload.model_dump())

    db.add(access)
    db.commit()
    db.refresh(access)

    return access


def get_property_access(
    db: Session,
    property_access_id: UUID
) -> Optional[PropertyAccess]:
    return (
        db.query(PropertyAccess)
        .filter(PropertyAccess.id == property_access_id)
        .first()
    )


def get_property_access_list(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(PropertyAccess)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_property_access(
    db: Session,
    property_access_id: UUID,
    payload: PropertyAccessUpdate
) -> Optional[PropertyAccess]:
    access = get_property_access(db, property_access_id)

    if not access:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(access, field, value)

    db.commit()
    db.refresh(access)

    return access


def delete_property_access(
    db: Session,
    property_access_id: UUID
) -> bool:
    access = get_property_access(db, property_access_id)

    if not access:
        return False

    db.delete(access)
    db.commit()

    return True