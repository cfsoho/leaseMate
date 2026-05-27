from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.utility_bill import UtilityBill
from app.db.schemas.utility_bill import (
    UtilityBillCreate,
    UtilityBillUpdate,
)

from app.services.soft_delete import soft_delete
from app.services.status_defaults import apply_default_status

def create_utility_bill(
    db: Session,
    payload: UtilityBillCreate
) -> UtilityBill:
    data = apply_default_status(
        db,
        payload.model_dump(),
        group_code="UTILITY_BILL",
        code="PENDING",
    )
    utility_bill = UtilityBill(**data)

    db.add(utility_bill)
    db.commit()
    db.refresh(utility_bill)

    return utility_bill


def get_utility_bill(
    db: Session,
    utility_bill_id: UUID
) -> Optional[UtilityBill]:
    return (
        db.query(UtilityBill)
        .filter(UtilityBill.id == utility_bill_id)
        .first()
    )


def get_utility_bills(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(UtilityBill)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_utility_bill(
    db: Session,
    utility_bill_id: UUID,
    payload: UtilityBillUpdate
) -> Optional[UtilityBill]:
    utility_bill = get_utility_bill(db, utility_bill_id)

    if not utility_bill:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(utility_bill, field, value)

    db.commit()
    db.refresh(utility_bill)

    return utility_bill


def delete_utility_bill(
    db: Session,
    utility_bill_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    utility_bill = get_utility_bill(db, utility_bill_id)

    if not utility_bill:
        return False
    soft_delete(db, utility_bill, deleted_by)

    return True
