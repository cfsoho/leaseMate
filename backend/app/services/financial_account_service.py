from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.financial_account import FinancialAccount
from app.db.models.ref.financial_institution_branch import FinancialInstitutionBranch
from app.db.schemas.financial_account import (
    FinancialAccountCreate,
    FinancialAccountUpdate,
)

from app.services.soft_delete import soft_delete


def _normalize_financial_account_data(data: dict) -> dict:
    normalized = dict(data)

    if normalized.get("account_number") is not None:
        normalized["account_number"] = str(normalized["account_number"]).strip()

    if normalized.get("currency_code") is not None:
        normalized["currency_code"] = str(normalized["currency_code"]).strip().upper()

    for field_name in (
        "legal_name_id",
        "financial_institution_branch_id",
        "account_number",
        "currency_code",
    ):
        if normalized.get(field_name) in (None, ""):
            raise ValueError("Legal name, bank branch, account number, and currency are required.")

    return normalized


def _ensure_unique_financial_account_identity(
    db: Session,
    *,
    user_id: UUID,
    branch_id: UUID,
    account_number: str,
    exclude_account_id: Optional[UUID] = None,
) -> None:
    branch_bank_id = (
        db.query(FinancialInstitutionBranch.financial_institution_id)
        .filter(FinancialInstitutionBranch.id == branch_id)
        .scalar()
    )

    if not branch_bank_id:
        raise ValueError("Bank branch is not valid.")

    query = (
        db.query(FinancialAccount.id)
        .join(
            FinancialInstitutionBranch,
            FinancialInstitutionBranch.id
            == FinancialAccount.financial_institution_branch_id,
        )
        .filter(
            FinancialAccount.user_id == user_id,
            FinancialInstitutionBranch.financial_institution_id == branch_bank_id,
            FinancialAccount.account_number == account_number,
            FinancialAccount.is_deleted.is_(False),
        )
    )

    if exclude_account_id:
        query = query.filter(FinancialAccount.id != exclude_account_id)

    if query.first():
        raise ValueError(
            "Bank account number already exists for this bank."
        )


def _validate_financial_account_identity(
    db: Session,
    data: dict,
    *,
    exclude_account_id: Optional[UUID] = None,
) -> dict:
    normalized = _normalize_financial_account_data(data)
    _ensure_unique_financial_account_identity(
        db,
        user_id=normalized["user_id"],
        branch_id=normalized["financial_institution_branch_id"],
        account_number=normalized["account_number"],
        exclude_account_id=exclude_account_id,
    )

    return normalized


def create_financial_account(
    db: Session,
    payload: FinancialAccountCreate
) -> FinancialAccount:
    data = _validate_financial_account_identity(db, payload.model_dump())
    account = FinancialAccount(**data)

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


def get_financial_account_for_user(
    db: Session,
    account_id: UUID,
    user_id: UUID
) -> Optional[FinancialAccount]:
    return (
        db.query(FinancialAccount)
        .filter(
            FinancialAccount.id == account_id,
            FinancialAccount.user_id == user_id,
            FinancialAccount.is_deleted.is_(False),
        )
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


def get_financial_accounts_for_user(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(FinancialAccount)
        .filter(
            FinancialAccount.user_id == user_id,
            FinancialAccount.is_deleted.is_(False),
        )
        .order_by(FinancialAccount.is_active.desc(), FinancialAccount.created_at.desc())
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

    update_data = payload.model_dump(exclude_unset=True)
    next_data = {
        "user_id": account.user_id,
        "legal_name_id": account.legal_name_id,
        "financial_institution_branch_id": account.financial_institution_branch_id,
        "account_number": account.account_number,
        "currency_code": account.currency_code,
        **update_data,
    }
    normalized = _validate_financial_account_identity(
        db,
        next_data,
        exclude_account_id=account.id,
    )
    update_data.update(
        {
            key: normalized[key]
            for key in ("account_number", "currency_code")
            if key in update_data
        }
    )

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)

    return account


def update_financial_account_for_user(
    db: Session,
    account_id: UUID,
    user_id: UUID,
    payload: FinancialAccountUpdate
) -> Optional[FinancialAccount]:
    account = get_financial_account_for_user(db, account_id, user_id)

    if not account:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    next_data = {
        "user_id": account.user_id,
        "legal_name_id": account.legal_name_id,
        "financial_institution_branch_id": account.financial_institution_branch_id,
        "account_number": account.account_number,
        "currency_code": account.currency_code,
        **update_data,
    }
    normalized = _validate_financial_account_identity(
        db,
        next_data,
        exclude_account_id=account.id,
    )
    update_data.update(
        {
            key: normalized[key]
            for key in ("account_number", "currency_code")
            if key in update_data
        }
    )

    for field, value in update_data.items():
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


def delete_financial_account_for_user(
    db: Session,
    account_id: UUID,
    user_id: UUID,
    deleted_by: Optional[UUID] = None
) -> bool:
    account = get_financial_account_for_user(db, account_id, user_id)

    if not account:
        return False

    soft_delete(db, account, deleted_by)

    return True
