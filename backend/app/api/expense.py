from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseRead,
)
from app.services.expense_service import (
    create_expense,
    get_expense,
    get_expenses,
    update_expense,
    delete_expense,
)

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


@router.post("", response_model=ExpenseRead)
def create(
    payload: ExpenseCreate,
    db: Session = Depends(get_db)
):
    return create_expense(db, payload)


@router.get("", response_model=List[ExpenseRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_expenses(db, skip, limit)


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_one(
    expense_id: UUID,
    db: Session = Depends(get_db)
):
    expense = get_expense(db, expense_id)

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense


@router.put("/{expense_id}", response_model=ExpenseRead)
def update(
    expense_id: UUID,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    expense = update_expense(db, expense_id, payload)

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense


@router.delete("/{expense_id}")
def delete(
    expense_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_expense(db, expense_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {"message": "Expense deleted successfully"}