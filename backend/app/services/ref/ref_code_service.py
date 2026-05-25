from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.ref_code import (
    DocumentObjectTypeRef,
    DocumentStatusRef,
    DocumentVisibilityRef,
    FinancialTransactionSourceTypeRef,
    LedgerEntryTypeRef,
    PropertyAccessLevelCodeRef,
    RoleCodeRef,
    UserStatusRef,
    UserVerificationTokenTypeRef,
)
from app.db.schemas.ref.ref_code import RefCodeCreate, RefCodeUpdate


REF_CODE_MODELS = {
    "role-codes": RoleCodeRef,
    "user-statuses": UserStatusRef,
    "user-verification-token-types": UserVerificationTokenTypeRef,
    "property-access-level-codes": PropertyAccessLevelCodeRef,
    "document-statuses": DocumentStatusRef,
    "document-visibilities": DocumentVisibilityRef,
    "document-object-types": DocumentObjectTypeRef,
    "financial-transaction-source-types": FinancialTransactionSourceTypeRef,
    "ledger-entry-types": LedgerEntryTypeRef,
}

from app.services.soft_delete import soft_delete

def get_ref_code_model(catalog: str):
    return REF_CODE_MODELS.get(catalog)


def create_ref_code(
    db: Session,
    catalog: str,
    payload: RefCodeCreate
):
    model = get_ref_code_model(catalog)

    if not model:
        return None

    data = payload.model_dump(exclude_none=True)

    if model is not LedgerEntryTypeRef:
        data.pop("is_income", None)

    row = model(**data)
    db.add(row)
    db.commit()
    db.refresh(row)

    return row


def get_ref_code(
    db: Session,
    catalog: str,
    code: str
) -> Optional[object]:
    model = get_ref_code_model(catalog)

    if not model:
        return None

    return db.query(model).filter(model.code == code).first()


def get_ref_codes(
    db: Session,
    catalog: str,
    skip: int = 0,
    limit: int = 100
):
    model = get_ref_code_model(catalog)

    if not model:
        return None

    return (
        db.query(model)
        .order_by(model.code)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_ref_code(
    db: Session,
    catalog: str,
    code: str,
    payload: RefCodeUpdate
) -> Optional[object]:
    row = get_ref_code(db, catalog, code)

    if not row:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    if row.__class__ is not LedgerEntryTypeRef:
        update_data.pop("is_income", None)

    for field, value in update_data.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)

    return row


def delete_ref_code(
    db: Session,
    catalog: str,
    code: str,
    deleted_by: Optional[UUID] = None) -> bool:
    row = get_ref_code(db, catalog, code)

    if not row:
        return False
    soft_delete(db, row, deleted_by)

    return True


def upsert_ref_codes(
    db: Session,
    catalog: str,
    rows: list[dict]
) -> None:
    model = get_ref_code_model(catalog)

    if not model:
        raise ValueError(f"Unknown ref code catalog: {catalog}")

    for item in rows:
        row = db.query(model).filter(model.code == item["code"]).first()
        data = {
            "code": item["code"],
            "name": item["name"],
            "description": item.get("description"),
            "is_active": item.get("is_active", True),
        }

        if model is LedgerEntryTypeRef:
            data["is_income"] = item.get("is_income", False)

        if row:
            for field, value in data.items():
                setattr(row, field, value)
        else:
            db.add(model(**data))

    db.commit()
