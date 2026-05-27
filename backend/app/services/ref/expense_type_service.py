import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.expense_type import ExpenseType
from app.db.schemas.ref.expense_type import ExpenseTypeCreate, ExpenseTypeUpdate

from app.services.soft_delete import soft_delete
from app.services.ref.localized_shared_fields import (
    inherit_master_shared_fields,
    propagate_master_shared_fields,
)
from app.services.ref.translation_validation import ensure_translation_locale_available


EXPENSE_TYPE_SHARED_FIELDS = {"code", "is_active"}

def create_expense_type(db: Session, payload: ExpenseTypeCreate) -> ExpenseType:
    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    ensure_translation_locale_available(
        db,
        ExpenseType,
        data["id"],
        data["locale"],
    )
    inherit_master_shared_fields(
        db,
        ExpenseType,
        data,
        EXPENSE_TYPE_SHARED_FIELDS,
    )

    expense_type = ExpenseType(**data)

    db.add(expense_type)
    db.commit()
    db.refresh(expense_type)

    return expense_type


def get_expense_type(db: Session, expense_type_id: UUID, locale: str) -> Optional[ExpenseType]:
    return (
        db.query(ExpenseType)
        .filter(
            ExpenseType.id == expense_type_id,
            ExpenseType.locale == locale
        )
        .first()
    )


def get_expense_types(db: Session, locale: str = "en", skip: int = 0, limit: int = 100):
    return (
        db.query(ExpenseType)
        .filter(ExpenseType.locale == locale)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_expense_type(
    db: Session,
    expense_type_id: UUID,
    locale: str,
    payload: ExpenseTypeUpdate
) -> Optional[ExpenseType]:
    expense_type = get_expense_type(db, expense_type_id, locale)

    if not expense_type:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    ensure_translation_locale_available(
        db,
        ExpenseType,
        expense_type_id,
        update_data.get("locale"),
        locale,
    )

    for field, value in update_data.items():
        setattr(expense_type, field, value)

    propagate_master_shared_fields(
        db,
        ExpenseType,
        expense_type_id,
        locale,
        update_data,
        EXPENSE_TYPE_SHARED_FIELDS,
    )

    db.commit()
    db.refresh(expense_type)

    return expense_type


def delete_expense_type(db: Session, expense_type_id: UUID, locale: str,
    deleted_by: Optional[UUID] = None) -> bool:
    expense_type = get_expense_type(db, expense_type_id, locale)

    if not expense_type:
        return False
    soft_delete(db, expense_type, deleted_by)

    return True

def upsert_expense_types_from_list(
    db,
    items: list[dict]
) -> None:
    for item in items:
        existing_any_locale = (
            db.query(ExpenseType)
            .filter(ExpenseType.code == item["code"])
            .first()
        )

        shared_id = (
            existing_any_locale.id
            if existing_any_locale
            else uuid.uuid4()
        )

        for locale, translation in item["translations"].items():
            row = (
                db.query(ExpenseType)
                .filter(
                    ExpenseType.code == item["code"],
                    ExpenseType.locale == locale
                )
                .first()
            )

            if row:
                row.name = translation["name"]
                row.description = translation.get("description")
                row.is_active = item.get("is_active", True)
            else:
                db.add(
                    ExpenseType(
                        id=shared_id,
                        locale=locale,
                        code=item["code"],
                        name=translation["name"],
                        description=translation.get("description"),
                        is_active=item.get("is_active", True)
                    )
                )

    db.commit()
