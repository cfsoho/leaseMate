from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.expense_type import (
    ExpenseTypeCreate,
    ExpenseTypeUpdate,
    ExpenseTypeRead,
)
from app.services.expense_type_service import (
    create_expense_type,
    get_expense_type,
    get_expense_types,
    update_expense_type,
    delete_expense_type,
)

router = APIRouter(
    prefix="/expense-types",
    tags=["Expense Types"]
)


@router.post("", response_model=ExpenseTypeRead)
def create(
    payload: ExpenseTypeCreate,
    db: Session = Depends(get_db)
):
    return create_expense_type(db, payload)


@router.get("", response_model=List[ExpenseTypeRead])
def list_all(
    locale: str = "en",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_expense_types(db, locale, skip, limit)


@router.get("/{expense_type_id}/{locale}", response_model=ExpenseTypeRead)
def get_one(
    expense_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    expense_type = get_expense_type(db, expense_type_id, locale)

    if not expense_type:
        raise HTTPException(status_code=404, detail="Expense type not found")

    return expense_type


@router.put("/{expense_type_id}/{locale}", response_model=ExpenseTypeRead)
def update(
    expense_type_id: UUID,
    locale: str,
    payload: ExpenseTypeUpdate,
    db: Session = Depends(get_db)
):
    expense_type = update_expense_type(db, expense_type_id, locale, payload)

    if not expense_type:
        raise HTTPException(status_code=404, detail="Expense type not found")

    return expense_type


@router.delete("/{expense_type_id}/{locale}")
def delete(
    expense_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    deleted = delete_expense_type(db, expense_type_id, locale)

    if not deleted:
        raise HTTPException(status_code=404, detail="Expense type not found")

    return {"message": "Expense type deleted successfully"}