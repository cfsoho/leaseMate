from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionUpdate,
    FinancialTransactionRead,
)
from app.services.financial_transaction_service import (
    create_financial_transaction,
    get_financial_transaction,
    get_financial_transactions_for_user,
    update_financial_transaction,
    delete_financial_transaction,
)

router = APIRouter(
    prefix="/financial-transactions",
    tags=["Financial Transactions"],
    dependencies=[Depends(require_current_user)]
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
    financial_account_id: Optional[UUID] = None,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    return get_financial_transactions_for_user(
        db,
        current_user.id,
        skip,
        limit,
        financial_account_id,
    )


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
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_financial_transaction(db, transaction_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Financial transaction not found"
        )

    return {
        "message": "Financial transaction deleted successfully"
    }
