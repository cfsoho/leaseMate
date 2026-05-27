import uuid

from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.utility_type import UtilityType
from app.db.schemas.ref.utility_type import (
    UtilityTypeCreate,
    UtilityTypeUpdate,
)

from app.services.soft_delete import soft_delete
from app.services.ref.localized_shared_fields import (
    inherit_master_shared_fields,
    propagate_master_shared_fields,
)
from app.services.ref.translation_validation import ensure_translation_locale_available


UTILITY_TYPE_SHARED_FIELDS = {"code", "is_active"}

def create_utility_type(
    db: Session,
    payload: UtilityTypeCreate
) -> UtilityType:
    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    ensure_translation_locale_available(
        db,
        UtilityType,
        data["id"],
        data["locale"],
    )
    inherit_master_shared_fields(
        db,
        UtilityType,
        data,
        UTILITY_TYPE_SHARED_FIELDS,
    )

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

    update_data = payload.model_dump(exclude_unset=True)
    ensure_translation_locale_available(
        db,
        UtilityType,
        utility_type_id,
        update_data.get("locale"),
        locale,
    )

    for field, value in update_data.items():
        setattr(utility_type, field, value)

    propagate_master_shared_fields(
        db,
        UtilityType,
        utility_type_id,
        locale,
        update_data,
        UTILITY_TYPE_SHARED_FIELDS,
    )

    db.commit()
    db.refresh(utility_type)

    return utility_type


def delete_utility_type(
    db: Session,
    utility_type_id: UUID,
    locale: str,
    deleted_by: Optional[UUID] = None) -> bool:
    utility_type = get_utility_type(db, utility_type_id, locale)

    if not utility_type:
        return False
    soft_delete(db, utility_type, deleted_by)

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
