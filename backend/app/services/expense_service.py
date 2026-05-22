from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.expense import Expense
from app.db.schemas.expense import ExpenseCreate, ExpenseUpdate


def create_expense(db: Session, payload: ExpenseCreate) -> Expense:
    expense = Expense(**payload.model_dump())

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


def get_expense(db: Session, expense_id: UUID) -> Optional[Expense]:
    return (
        db.query(Expense)
        .filter(Expense.id == expense_id)
        .first()
    )


def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Expense)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_expense(
    db: Session,
    expense_id: UUID,
    payload: ExpenseUpdate
) -> Optional[Expense]:
    expense = get_expense(db, expense_id)

    if not expense:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


def delete_expense(db: Session, expense_id: UUID) -> bool:
    expense = get_expense(db, expense_id)

    if not expense:
        return False

    db.delete(expense)
    db.commit()

    return True