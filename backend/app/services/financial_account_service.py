from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.financial_account import FinancialAccount
from app.db.schemas.financial_account import (
    FinancialAccountCreate,
    FinancialAccountUpdate,
)

from app.services.soft_delete import soft_delete

def create_financial_account(
    db: Session,
    payload: FinancialAccountCreate
) -> FinancialAccount:
    account = FinancialAccount(**payload.model_dump())

    db.add(account)
    db.commit()
    db.refresh(account)

    return account


def get_financial_account(
    db: Session,
    account_id: UUID
) -> Optional[FinancialAccount]:
    return (
        db.query(FinancialAccount)
        .filter(FinancialAccount.id == account_id)
        .first()
    )


def get_financial_accounts(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(FinancialAccount)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_financial_account(
    db: Session,
    account_id: UUID,
    payload: FinancialAccountUpdate
) -> Optional[FinancialAccount]:
    account = get_financial_account(db, account_id)

    if not account:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)

    return account


def delete_financial_account(
    db: Session,
    account_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    account = get_financial_account(db, account_id)

    if not account:
        return False
    soft_delete(db, account, deleted_by)

    return True