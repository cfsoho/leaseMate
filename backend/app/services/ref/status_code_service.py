import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.status_code import StatusCode
from app.db.schemas.ref.status_code import StatusCodeCreate, StatusCodeUpdate
from app.services.soft_delete import soft_delete
from app.services.ref.localized_shared_fields import (
    inherit_master_shared_fields,
    propagate_master_shared_fields,
)
from app.services.ref.translation_validation import ensure_translation_locale_available


STATUS_SHARED_FIELDS = {
    "group_code",
    "code",
    "is_terminal",
    "is_success",
    "is_active",
}
STATUS_INHERITED_FIELDS = {*STATUS_SHARED_FIELDS, "sort_order"}


def create_status_code(db: Session, payload: StatusCodeCreate) -> StatusCode:
    data = payload.model_dump()
    should_rebalance_sort = "sort_order" in payload.model_fields_set
    requested_sort_order = data.get("sort_order", 0)

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    ensure_translation_locale_available(
        db,
        StatusCode,
        data["id"],
        data["locale"],
    )
    inherit_master_shared_fields(
        db,
        StatusCode,
        data,
        STATUS_INHERITED_FIELDS,
    )

    status_code = StatusCode(**data)
    db.add(status_code)
    if should_rebalance_sort:
        db.flush()
        _rebalance_status_group(db, status_code, requested_sort_order)
    db.commit()
    db.refresh(status_code)
    return status_code


def get_status_code(
    db: Session,
    status_code_id: UUID,
    locale: str
) -> Optional[StatusCode]:
    return (
        db.query(StatusCode)
        .filter(StatusCode.id == status_code_id, StatusCode.locale == locale)
        .first()
    )


def get_status_codes(
    db: Session,
    locale: str = "en",
    group_code: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(StatusCode).filter(StatusCode.locale == locale)

    if group_code is not None:
        query = query.filter(StatusCode.group_code == group_code)

    return (
        query.order_by(
            StatusCode.is_active.desc(),
            StatusCode.group_code,
            StatusCode.sort_order,
            StatusCode.code,
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_status_code(
    db: Session,
    status_code_id: UUID,
    locale: str,
    payload: StatusCodeUpdate
) -> Optional[StatusCode]:
    status_code = get_status_code(db, status_code_id, locale)
    if not status_code:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    current_sort_order = status_code.sort_order
    requested_sort_order = update_data.get("sort_order")
    ensure_translation_locale_available(
        db,
        StatusCode,
        status_code_id,
        update_data.get("locale"),
        locale,
    )

    for field, value in update_data.items():
        setattr(status_code, field, value)

    should_rebalance_sort = (
        requested_sort_order is not None
        and requested_sort_order != current_sort_order
    )

    if should_rebalance_sort:
        db.flush()
        _rebalance_status_group(db, status_code, requested_sort_order)

    propagate_master_shared_fields(
        db,
        StatusCode,
        status_code_id,
        locale,
        update_data,
        STATUS_SHARED_FIELDS,
    )

    db.commit()
    db.refresh(status_code)
    return status_code


def _rebalance_status_group(
    db: Session,
    status_code: StatusCode,
    requested_sort_order: int,
) -> None:
    group_records = (
        db.query(StatusCode)
        .filter(
            StatusCode.locale == status_code.locale,
            StatusCode.group_code == status_code.group_code,
        )
        .order_by(StatusCode.sort_order, StatusCode.name)
        .all()
    )
    moving_record = next(
        (record for record in group_records if record.id == status_code.id),
        status_code,
    )
    remaining_records = [
        record for record in group_records if record.id != status_code.id
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
        db.query(StatusCode).filter(StatusCode.id == record.id).update(
            {"sort_order": normalized_sort_order},
            synchronize_session=False,
        )


def delete_status_code(
    db: Session,
    status_code_id: UUID,
    locale: str,
    deleted_by: Optional[UUID] = None
) -> bool:
    status_code = get_status_code(db, status_code_id, locale)
    if not status_code:
        return False

    soft_delete(db, status_code, deleted_by)
    return True


def upsert_status_codes_from_list(db: Session, items: list[dict]) -> None:
    for item in items:
        existing_any_locale = (
            db.query(StatusCode)
            .filter(StatusCode.group_code == item["group_code"], StatusCode.code == item["code"])
            .execution_options(include_deleted=True)
            .first()
        )

        shared_id = (
            uuid.UUID(item["id"])
            if item.get("id")
            else existing_any_locale.id if existing_any_locale else uuid.uuid4()
        )

        for locale, translation in item["translations"].items():
            status_code = (
                db.query(StatusCode)
                .filter(
                    StatusCode.group_code == item["group_code"],
                    StatusCode.code == item["code"],
                    StatusCode.locale == locale
                )
                .execution_options(include_deleted=True)
                .first()
            )

            data = {
                "id": shared_id,
                "locale": locale,
                "group_code": item["group_code"],
                "code": item["code"],
                "name": translation["name"],
                "description": translation.get("description"),
                "is_terminal": item.get("is_terminal", False),
                "is_success": item.get("is_success", False),
                "is_active": item.get("is_active", True),
                "sort_order": item.get("sort_order", 0),
            }

            if status_code:
                for field, value in data.items():
                    setattr(status_code, field, value)
                status_code.is_deleted = False
                status_code.deleted_at = None
                status_code.deleted_by = None
            else:
                db.add(StatusCode(**data))

    db.commit()
