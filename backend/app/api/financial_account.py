from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.models.financial_account import FinancialAccount
from app.db.models.user import User
from app.db.models.user_delegation import UserDelegation
from app.db.models.user_legal_name import UserLegalName
from app.db.schemas.financial_account import (
    FinancialAccountCreate,
    FinancialAccountUpdate,
    FinancialAccountRead,
    FinancialAccountLegalNameOptionRead,
    FinancialAccountLegalNameOwnerOptionRead,
)
from app.services.financial_account_service import (
    create_financial_account,
    delete_financial_account,
    get_financial_account,
    get_financial_accounts_for_users,
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
    legal_name = validate_bank_account_legal_name_access(
        db,
        payload.legal_name_id,
        current_user.id,
        manage_required=True,
    )
    payload = payload.model_copy(update={"user_id": legal_name.user_id})
    try:
        return create_financial_account(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/legal-name-options", response_model=List[FinancialAccountLegalNameOptionRead])
def list_legal_name_options(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserLegalName, User)
        .join(User, User.id == UserLegalName.user_id)
        .filter(
            UserLegalName.user_id.in_(
                get_bank_account_access_user_ids(
                    db,
                    current_user.id,
                    manage_required=True,
                )
            ),
            UserLegalName.is_deleted.is_(False),
        )
        .order_by(User.family_name.asc(), User.given_name.asc(), UserLegalName.full_name.asc())
        .all()
    )
    return [
        FinancialAccountLegalNameOptionRead(
            id=legal_name.id,
            user_id=legal_name.user_id,
            user_family_name=user.family_name,
            user_given_name=user.given_name,
            user_preferred_locale_code=user.preferred_locale_code,
            country_id=legal_name.country_id,
            locale_code=legal_name.locale_code,
            full_name=legal_name.full_name,
        )
        for legal_name, user in rows
    ]


@router.get(
    "/legal-name-owner-options",
    response_model=List[FinancialAccountLegalNameOwnerOptionRead],
)
def list_legal_name_owner_options(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    user_ids = get_legal_name_bank_account_manage_user_ids(db, current_user.id)
    if not user_ids:
        return []

    users = (
        db.query(User)
        .filter(
            User.id.in_(user_ids),
            User.is_deleted.is_(False),
        )
        .order_by(User.family_name.asc(), User.given_name.asc())
        .all()
    )
    return [
        FinancialAccountLegalNameOwnerOptionRead(
            id=user.id,
            family_name=user.family_name,
            given_name=user.given_name,
            preferred_locale_code=user.preferred_locale_code,
        )
        for user in users
    ]


@router.get("", response_model=List[FinancialAccountRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    return get_financial_accounts_for_users(
        db,
        get_bank_account_access_user_ids(
            db,
            current_user.id,
            manage_required=False,
        ),
        skip,
        limit,
    )


@router.get("/{account_id}", response_model=FinancialAccountRead)
def get_one(
    account_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    account = get_financial_account(db, account_id)

    if not account or not can_access_bank_account(
        db,
        account,
        current_user.id,
        manage_required=False,
    ):
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    return account


@router.put("/{account_id}", response_model=FinancialAccountRead)
def update(
    account_id: UUID,
    payload: FinancialAccountUpdate,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    existing_account = get_financial_account(db, account_id)

    if not existing_account or not can_access_bank_account(
        db,
        existing_account,
        current_user.id,
        manage_required=True,
    ):
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

    legal_name_id = payload.legal_name_id or existing_account.legal_name_id
    legal_name = validate_bank_account_legal_name_access(
        db,
        legal_name_id,
        current_user.id,
        manage_required=True,
    )
    payload = payload.model_copy(update={"user_id": legal_name.user_id})
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
    account = get_financial_account(db, account_id)
    if not account or not can_access_bank_account(
        db,
        account,
        current_user.id,
        manage_required=True,
    ):
        raise HTTPException(
            status_code=404,
            detail="Financial account not found"
        )

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


def get_bank_account_access_user_ids(
    db: Session,
    current_user_id: UUID,
    *,
    manage_required: bool,
) -> list[UUID]:
    query = db.query(UserDelegation.subject_user_id).filter(
        UserDelegation.delegate_user_id == current_user_id,
        UserDelegation.is_active.is_(True),
    )
    if manage_required:
        query = query.filter(UserDelegation.can_manage_bank_accounts.is_(True))
    else:
        query = query.filter(
            (
                UserDelegation.can_view_bank_accounts.is_(True)
            ) | (
                UserDelegation.can_manage_bank_accounts.is_(True)
            )
        )
    return [current_user_id, *[row[0] for row in query.all()]]


def get_legal_name_bank_account_manage_user_ids(
    db: Session,
    current_user_id: UUID,
) -> list[UUID]:
    rows = (
        db.query(UserDelegation.subject_user_id)
        .filter(
            UserDelegation.delegate_user_id == current_user_id,
            UserDelegation.can_manage_legal_names.is_(True),
            UserDelegation.can_manage_bank_accounts.is_(True),
            UserDelegation.is_active.is_(True),
        )
        .all()
    )
    return [row[0] for row in rows]


def can_access_bank_account(
    db: Session,
    account: FinancialAccount,
    current_user_id: UUID,
    *,
    manage_required: bool,
) -> bool:
    return account.user_id in get_bank_account_access_user_ids(
        db,
        current_user_id,
        manage_required=manage_required,
    )


def validate_bank_account_legal_name_access(
    db: Session,
    legal_name_id: Optional[UUID],
    current_user_id: UUID,
    *,
    manage_required: bool,
) -> UserLegalName:
    if not legal_name_id:
        raise HTTPException(
            status_code=400,
            detail="Legal name is required",
        )

    legal_name = (
        db.query(UserLegalName)
        .filter(
            UserLegalName.id == legal_name_id,
            UserLegalName.is_deleted.is_(False),
        )
        .first()
    )

    if not legal_name or legal_name.user_id not in get_bank_account_access_user_ids(
        db,
        current_user_id,
        manage_required=manage_required,
    ):
        raise HTTPException(
            status_code=400,
            detail="You do not have bank account management access for this legal name.",
        )
    return legal_name
