import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.status_code import StatusCode
from app.db.schemas.ref.status_code import StatusCodeCreate, StatusCodeUpdate
from app.services.soft_delete import soft_delete


def create_status_code(db: Session, payload: StatusCodeCreate) -> StatusCode:
    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    status_code = StatusCode(**data)
    db.add(status_code)
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

    return query.order_by(StatusCode.group_code, StatusCode.sort_order).offset(skip).limit(limit).all()


def update_status_code(
    db: Session,
    status_code_id: UUID,
    locale: str,
    payload: StatusCodeUpdate
) -> Optional[StatusCode]:
    status_code = get_status_code(db, status_code_id, locale)
    if not status_code:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(status_code, field, value)

    db.commit()
    db.refresh(status_code)
    return status_code


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
