import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.property_access_level import PropertyAccessLevel
from app.db.schemas.ref.property_access_level import (
    PropertyAccessLevelCreate,
    PropertyAccessLevelUpdate,
)
from app.services.ref.localized_shared_fields import (
    inherit_master_shared_fields,
    propagate_master_shared_fields,
)
from app.services.ref.translation_validation import ensure_translation_locale_available


PROPERTY_ACCESS_LEVEL_SHARED_FIELDS = {
    "code",
    "allow_multiple",
    "record_readonly",
    "record_writable",
    "record_deletable",
    "is_active",
}
PROPERTY_ACCESS_LEVEL_INHERITED_FIELDS = {
    *PROPERTY_ACCESS_LEVEL_SHARED_FIELDS,
    "sort_order",
}


def create_property_access_level(
    db: Session,
    payload: PropertyAccessLevelCreate
) -> PropertyAccessLevel:
    data = payload.model_dump()
    should_rebalance_sort = "sort_order" in payload.model_fields_set
    requested_sort_order = data.get("sort_order", 0)

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    ensure_translation_locale_available(
        db,
        PropertyAccessLevel,
        data["id"],
        data["locale"],
    )
    inherit_master_shared_fields(
        db,
        PropertyAccessLevel,
        data,
        PROPERTY_ACCESS_LEVEL_INHERITED_FIELDS,
    )

    access_level = PropertyAccessLevel(**data)

    db.add(access_level)
    if should_rebalance_sort:
        db.flush()
        _rebalance_property_access_levels(db, access_level, requested_sort_order)
    db.commit()
    db.refresh(access_level)

    return access_level

from app.services.soft_delete import soft_delete

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
        .order_by(
            PropertyAccessLevel.is_active.desc(),
            PropertyAccessLevel.sort_order,
            PropertyAccessLevel.name,
        )
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
    current_sort_order = access_level.sort_order
    requested_sort_order = update_data.get("sort_order")
    ensure_translation_locale_available(
        db,
        PropertyAccessLevel,
        access_level_id,
        update_data.get("locale"),
        locale,
    )

    for field, value in update_data.items():
        setattr(access_level, field, value)

    should_rebalance_sort = (
        requested_sort_order is not None
        and requested_sort_order != current_sort_order
    )

    if should_rebalance_sort:
        db.flush()
        _rebalance_property_access_levels(db, access_level, requested_sort_order)

    propagate_master_shared_fields(
        db,
        PropertyAccessLevel,
        access_level_id,
        locale,
        update_data,
        PROPERTY_ACCESS_LEVEL_SHARED_FIELDS,
    )

    db.commit()
    db.refresh(access_level)

    return access_level


def _rebalance_property_access_levels(
    db: Session,
    access_level: PropertyAccessLevel,
    requested_sort_order: int,
) -> None:
    level_records = (
        db.query(PropertyAccessLevel)
        .filter(PropertyAccessLevel.locale == access_level.locale)
        .order_by(PropertyAccessLevel.sort_order, PropertyAccessLevel.name)
        .all()
    )
    moving_record = next(
        (record for record in level_records if record.id == access_level.id),
        access_level,
    )
    remaining_records = [
        record for record in level_records if record.id != access_level.id
    ]
    insert_index = sum(
        1
        for record in remaining_records
        if record.sort_order <= requested_sort_order
    )
    ordered_records = [
        *remaining_records[:insert_index],
        moving_record,
        *remaining_records[insert_index:],
    ]

    for index, record in enumerate(ordered_records, start=1):
        normalized_sort_order = index * 10
        db.query(PropertyAccessLevel).filter(PropertyAccessLevel.id == record.id).update(
            {"sort_order": normalized_sort_order},
            synchronize_session=False,
        )


def delete_property_access_level(
    db: Session,
    access_level_id: UUID,
    locale: str,
    deleted_by: Optional[UUID] = None) -> bool:
    access_level = get_property_access_level(db, access_level_id, locale)

    if not access_level:
        return False
    soft_delete(db, access_level, deleted_by)

    return True

def upsert_property_access_levels_from_list(
    db,
    items: list[dict]
) -> None:
    for item in items:
        access_level_code = item["code"]

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
                row.allow_multiple = item.get("allow_multiple", True)
                row.record_readonly = item.get("record_readonly", True)
                row.record_writable = item.get("record_writable", False)
                row.record_deletable = item.get("record_deletable", False)
                row.sort_order = item.get("sort_order", 0)
                row.is_active = item.get("is_active", True)
            else:
                db.add(
                    PropertyAccessLevel(
                        id=shared_id,
                        locale=locale,
                        code=access_level_code,
                        name=translation["name"],
                        description=translation.get("description"),
                        allow_multiple=item.get("allow_multiple", True),
                        record_readonly=item.get("record_readonly", True),
                        record_writable=item.get("record_writable", False),
                        record_deletable=item.get("record_deletable", False),
                        sort_order=item.get("sort_order", 0),
                        is_active=item.get("is_active", True)
                    )
                )

    db.commit()
