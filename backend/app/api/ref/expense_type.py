from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.expense_type import (
    ExpenseTypeCreate,
    ExpenseTypeUpdate,
    ExpenseTypeRead,
)
from app.services.ref.expense_type_service import (
    create_expense_type,
    get_expense_type,
    get_expense_types,
    update_expense_type,
    delete_expense_type,
)

router = APIRouter(
    prefix="/expense-types",
    tags=["Expense Types"],
    dependencies=[Depends(require_admin)]
)


@router.post("", response_model=ExpenseTypeRead)
def create(
    payload: ExpenseTypeCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        return create_expense_type(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


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
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        expense_type = update_expense_type(db, expense_type_id, locale, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if not expense_type:
        raise HTTPException(status_code=404, detail="Expense type not found")

    return expense_type


@router.delete("/{expense_type_id}/{locale}")
def delete(
    expense_type_id: UUID,
    locale: str,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_expense_type(db, expense_type_id, locale, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Expense type not found")

    return {"message": "Expense type deleted successfully"}
