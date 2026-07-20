from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.models.user_legal_name import UserLegalName
from app.db.schemas.financial_account import (
    FinancialAccountCreate,
    FinancialAccountUpdate,
    FinancialAccountRead,
)
from app.services.financial_account_service import (
    create_financial_account,
    delete_financial_account,
    get_financial_account,
    get_financial_accounts,
    update_financial_account,
)

router = APIRouter(
    prefix="/financial-accounts",
    tags=["Financial Accounts"],
    dependencies=[Depends(require_current_user)]
)


@router.post("", response_model=FinancialAccountRead)
def create(
    payload: FinancialAccountCreate,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = payload.user_id or current_user.id
    validate_legal_name_owner(db, payload.legal_name_id, target_user_id)
    payload.user_id = target_user_id
    try:
        return create_financial_account(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


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
    existing_account = get_financial_account(db, account_id)

    if not existing_account:
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    target_user_id = payload.user_id or existing_account.user_id
    validate_legal_name_owner(
        db,
        payload.legal_name_id or existing_account.legal_name_id,
        target_user_id,
    )
    try:
        account = update_financial_account(
            db,
            account_id,
            payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    return account


@router.delete("/{account_id}")
def delete(
    account_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_financial_account(
        db,
        account_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    return {
        "message": "Financial account deleted successfully"
    }


def validate_legal_name_owner(
    db: Session,
    legal_name_id: Optional[UUID],
    user_id: UUID,
) -> None:
    if not legal_name_id:
        return

    exists = (
        db.query(UserLegalName.id)
        .filter(
            UserLegalName.id == legal_name_id,
            UserLegalName.user_id == user_id,
            UserLegalName.is_deleted.is_(False),
        )
        .first()
    )

    if not exists:
        raise HTTPException(
            status_code=400,
            detail="Legal name does not belong to the selected user",
        )
