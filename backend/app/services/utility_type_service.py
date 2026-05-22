import uuid

from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.utility_type import UtilityType
from app.db.schemas.utility_type import (
    UtilityTypeCreate,
    UtilityTypeUpdate,
)


def create_utility_type(
    db: Session,
    payload: UtilityTypeCreate
) -> UtilityType:
    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    utility_type = UtilityType(**data)

    db.add(utility_type)
    db.commit()
    db.refresh(utility_type)

    return utility_type


def get_utility_type(
    db: Session,
    utility_type_id: UUID,
    locale: str
) -> Optional[UtilityType]:
    return (
        db.query(UtilityType)
        .filter(
            UtilityType.id == utility_type_id,
            UtilityType.locale == locale
        )
        .first()
    )


def get_utility_types(
    db: Session,
    locale: str = "en",
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(UtilityType)
        .filter(UtilityType.locale == locale)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_utility_type(
    db: Session,
    utility_type_id: UUID,
    locale: str,
    payload: UtilityTypeUpdate
) -> Optional[UtilityType]:
    utility_type = get_utility_type(db, utility_type_id, locale)

    if not utility_type:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(utility_type, field, value)

    db.commit()
    db.refresh(utility_type)

    return utility_type


def delete_utility_type(
    db: Session,
    utility_type_id: UUID,
    locale: str
) -> bool:
    utility_type = get_utility_type(db, utility_type_id, locale)

    if not utility_type:
        return False

    db.delete(utility_type)
    db.commit()

    return True



def upsert_utility_types_from_list(
    db,
    items: list[dict]
) -> None:
    for item in items:
        existing_any_locale = (
            db.query(UtilityType)
            .filter(UtilityType.code == item["code"])
            .first()
        )

        shared_id = existing_any_locale.id if existing_any_locale else uuid.uuid4()

        for locale, translation in item["translations"].items():
            row = (
                db.query(UtilityType)
                .filter(
                    UtilityType.code == item["code"],
                    UtilityType.locale == locale
                )
                .first()
            )

            if row:
                row.name = translation["name"]
                row.description = translation.get("description")
                row.is_active = item.get("is_active", True)
            else:
                db.add(
                    UtilityType(
                        id=shared_id,
                        locale=locale,
                        code=item["code"],
                        name=translation["name"],
                        description=translation.get("description"),
                        is_active=item.get("is_active", True)
                    )
                )

    db.commit()