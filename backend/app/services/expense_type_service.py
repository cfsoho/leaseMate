import uuid
from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.expense_type import ExpenseType
from app.db.schemas.expense_type import ExpenseTypeCreate, ExpenseTypeUpdate


def create_expense_type(db: Session, payload: ExpenseTypeCreate) -> ExpenseType:
    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

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

    for field, value in update_data.items():
        setattr(expense_type, field, value)

    db.commit()
    db.refresh(expense_type)

    return expense_type


def delete_expense_type(db: Session, expense_type_id: UUID, locale: str) -> bool:
    expense_type = get_expense_type(db, expense_type_id, locale)

    if not expense_type:
        return False

    db.delete(expense_type)
    db.commit()

    return True