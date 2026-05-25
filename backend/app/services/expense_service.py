from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.expense import Expense
from app.db.schemas.expense import ExpenseCreate, ExpenseUpdate

from app.services.soft_delete import soft_delete

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


def delete_expense(db: Session, expense_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    expense = get_expense(db, expense_id)

    if not expense:
        return False
    soft_delete(db, expense, deleted_by)

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