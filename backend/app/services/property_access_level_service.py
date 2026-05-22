import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.property_access_level import PropertyAccessLevel
from app.db.schemas.property_access_level import (
    PropertyAccessLevelCreate,
    PropertyAccessLevelUpdate,
)
from app.db.models.enums.property_access_level_code import (
    PropertyAccessLevelCode,
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

def upsert_property_access_levels_from_list(
    db,
    items: list[dict]
) -> None:
    for item in items:
        access_level_code = PropertyAccessLevelCode(item["code"])

        existing_any_locale = (
            db.query(PropertyAccessLevel)
            .filter(PropertyAccessLevel.code == access_level_code)
            .first()
        )

        shared_id = existing_any_locale.id if existing_any_locale else uuid.uuid4()

        for locale, translation in item["translations"].items():
            row = (
                db.query(PropertyAccessLevel)
                .filter(
                    PropertyAccessLevel.code == access_level_code,
                    PropertyAccessLevel.locale == locale
                )
                .first()
            )

            if row:
                row.name = translation["name"]
                row.description = translation.get("description")
                row.is_active = item.get("is_active", True)
            else:
                db.add(
                    PropertyAccessLevel(
                        id=shared_id,
                        locale=locale,
                        code=access_level_code,
                        name=translation["name"],
                        description=translation.get("description"),
                        is_active=item.get("is_active", True)
                    )
                )

    db.commit()