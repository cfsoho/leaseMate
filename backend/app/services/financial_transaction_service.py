from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.financial_account import FinancialAccount
from app.db.models.financial_transaction import FinancialTransaction
from app.db.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionUpdate,
)

from app.services.soft_delete import soft_delete

def validate_transaction_amounts(
    deposit_amount,
    withdrawal_amount
) -> None:
    if deposit_amount is not None and withdrawal_amount is not None:
        raise ValueError("Only one of deposit_amount or withdrawal_amount can be set")

    if deposit_amount is None and withdrawal_amount is None:
        raise ValueError("Either deposit_amount or withdrawal_amount must be set")


def create_financial_transaction(
    db: Session,
    payload: FinancialTransactionCreate
) -> FinancialTransaction:
    validate_transaction_amounts(
        payload.deposit_amount,
        payload.withdrawal_amount
    )

    transaction = FinancialTransaction(**payload.model_dump())

    db.add(transaction)

    account = (
        db.query(FinancialAccount)
        .filter(FinancialAccount.id == payload.financial_account_id)
        .first()
    )

    if account:
        account.current_balance = payload.balance_after

    db.commit()
    db.refresh(transaction)

    return transaction


def create_financial_transaction_for_user(
    db: Session,
    user_id: UUID,
    payload: FinancialTransactionCreate
) -> FinancialTransaction:
    account = (
        db.query(FinancialAccount)
        .filter(
            FinancialAccount.id == payload.financial_account_id,
            FinancialAccount.user_id == user_id,
            FinancialAccount.is_deleted.is_(False),
        )
        .first()
    )

    if not account:
        raise ValueError("Financial account not found")

    return create_financial_transaction(db, payload)


def get_financial_transaction(
    db: Session,
    transaction_id: UUID
) -> Optional[FinancialTransaction]:
    return (
        db.query(FinancialTransaction)
        .filter(FinancialTransaction.id == transaction_id)
        .first()
    )


def get_financial_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(FinancialTransaction)
        .order_by(
            FinancialTransaction.transaction_date.desc(),
            FinancialTransaction.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_financial_transactions_for_user(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    financial_account_id: Optional[UUID] = None,
):
    query = (
        db.query(FinancialTransaction)
        .join(FinancialAccount)
        .filter(
            FinancialAccount.user_id == user_id,
            FinancialAccount.is_deleted.is_(False),
            FinancialTransaction.is_deleted.is_(False),
        )
    )

    if financial_account_id:
        query = query.filter(FinancialTransaction.financial_account_id == financial_account_id)

    return (
        query.order_by(
            FinancialTransaction.transaction_date.desc(),
            FinancialTransaction.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_financial_transaction(
    db: Session,
    transaction_id: UUID,
    payload: FinancialTransactionUpdate
) -> Optional[FinancialTransaction]:
    transaction = get_financial_transaction(db, transaction_id)

    if not transaction:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    deposit_amount = update_data.get(
        "deposit_amount",
        transaction.deposit_amount
    )
    withdrawal_amount = update_data.get(
        "withdrawal_amount",
        transaction.withdrawal_amount
    )

    validate_transaction_amounts(deposit_amount, withdrawal_amount)

    for field, value in update_data.items():
        setattr(transaction, field, value)

    if "balance_after" in update_data:
        account = (
            db.query(FinancialAccount)
            .filter(FinancialAccount.id == transaction.financial_account_id)
            .first()
        )

        if account:
            account.current_balance = transaction.balance_after

    db.commit()
    db.refresh(transaction)

    return transaction


def delete_financial_transaction(
    db: Session,
    transaction_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    transaction = get_financial_transaction(db, transaction_id)

    if not transaction:
        return False
    soft_delete(db, transaction, deleted_by)

    return True
