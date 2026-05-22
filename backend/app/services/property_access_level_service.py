import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.property_access_level import PropertyAccessLevel
from app.db.schemas.property_access_level import (
    PropertyAccessLevelCreate,
    PropertyAccessLevelUpdate,
)


def create_property_access_level(
    db: Session,
    payload: PropertyAccessLevelCreate
) -> PropertyAccessLevel:
    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    access_level = PropertyAccessLevel(**data)

    db.add(access_level)
    db.commit()
    db.refresh(access_level)

    return access_level


def get_property_access_level(
    db: Session,
    access_level_id: UUID,
    locale: str
) -> Optional[PropertyAccessLevel]:
    return (
        db.query(PropertyAccessLevel)
        .filter(
            PropertyAccessLevel.id == access_level_id,
            PropertyAccessLevel.locale == locale
        )
        .first()
    )


def get_property_access_levels(
    db: Session,
    locale: str = "en",
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(PropertyAccessLevel)
        .filter(PropertyAccessLevel.locale == locale)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_property_access_level(
    db: Session,
    access_level_id: UUID,
    locale: str,
    payload: PropertyAccessLevelUpdate
) -> Optional[PropertyAccessLevel]:
    access_level = get_property_access_level(db, access_level_id, locale)

    if not access_level:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(access_level, field, value)

    db.commit()
    db.refresh(access_level)

    return access_level


def delete_property_access_level(
    db: Session,
    access_level_id: UUID,
    locale: str
) -> bool:
    access_level = get_property_access_level(db, access_level_id, locale)

    if not access_level:
        return False

    db.delete(access_level)
    db.commit()

    return True