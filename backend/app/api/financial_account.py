from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.financial_account import (
    FinancialAccountCreate,
    FinancialAccountUpdate,
    FinancialAccountRead,
)
from app.services.financial_account_service import (
    create_financial_account,
    get_financial_account,
    get_financial_accounts,
    update_financial_account,
    delete_financial_account,
)

router = APIRouter(
    prefix="/financial-accounts",
    tags=["Financial Accounts"]
)


@router.post("", response_model=FinancialAccountRead)
def create(
    payload: FinancialAccountCreate,
    db: Session = Depends(get_db)
):
    return create_financial_account(db, payload)


@router.get("", response_model=List[FinancialAccountRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_financial_accounts(db, skip, limit)


@router.get("/{account_id}", response_model=FinancialAccountRead)
def get_one(
    account_id: UUID,
    db: Session = Depends(get_db)
):
    account = get_financial_account(db, account_id)

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    return account


@router.put("/{account_id}", response_model=FinancialAccountRead)
def update(
    account_id: UUID,
    payload: FinancialAccountUpdate,
    db: Session = Depends(get_db)
):
    account = update_financial_account(db, account_id, payload)

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    return account


@router.delete("/{account_id}")
def delete(
    account_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_financial_account(db, account_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    return {
        "message": "Financial account deleted successfully"
    }