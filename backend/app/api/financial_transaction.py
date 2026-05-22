from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionUpdate,
    FinancialTransactionRead,
)
from app.services.financial_transaction_service import (
    create_financial_transaction,
    get_financial_transaction,
    get_financial_transactions,
    update_financial_transaction,
    delete_financial_transaction,
)

router = APIRouter(
    prefix="/financial-transactions",
    tags=["Financial Transactions"]
)


@router.post("", response_model=FinancialTransactionRead)
def create(
    payload: FinancialTransactionCreate,
    db: Session = Depends(get_db)
):
    try:
        return create_financial_transaction(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[FinancialTransactionRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_financial_transactions(db, skip, limit)


@router.get("/{transaction_id}", response_model=FinancialTransactionRead)
def get_one(
    transaction_id: UUID,
    db: Session = Depends(get_db)
):
    transaction = get_financial_transaction(db, transaction_id)

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Financial transaction not found"
        )

    return transaction


@router.put("/{transaction_id}", response_model=FinancialTransactionRead)
def update(
    transaction_id: UUID,
    payload: FinancialTransactionUpdate,
    db: Session = Depends(get_db)
):
    try:
        transaction = update_financial_transaction(
            db,
            transaction_id,
            payload
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Financial transaction not found"
        )

    return transaction


@router.delete("/{transaction_id}")
def delete(
    transaction_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_financial_transaction(db, transaction_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Financial transaction not found"
        )

    return {
        "message": "Financial transaction deleted successfully"
    }