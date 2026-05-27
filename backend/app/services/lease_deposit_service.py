from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.lease_deposit import LeaseDeposit
from app.db.schemas.lease_deposit import LeaseDepositCreate, LeaseDepositUpdate

from app.services.soft_delete import soft_delete
from app.services.status_defaults import apply_default_status

def create_lease_deposit(db: Session, payload: LeaseDepositCreate) -> LeaseDeposit:
    data = apply_default_status(
        db,
        payload.model_dump(),
        group_code="DEPOSIT",
        code="PENDING",
    )
    deposit = LeaseDeposit(**data)
    db.add(deposit)
    db.commit()
    db.refresh(deposit)
    return deposit


def get_lease_deposit(db: Session, deposit_id: UUID) -> Optional[LeaseDeposit]:
    return db.query(LeaseDeposit).filter(LeaseDeposit.id == deposit_id).first()


def get_lease_deposits(db: Session, skip: int = 0, limit: int = 100):
    return db.query(LeaseDeposit).offset(skip).limit(limit).all()


def update_lease_deposit(
    db: Session,
    deposit_id: UUID,
    payload: LeaseDepositUpdate
) -> Optional[LeaseDeposit]:
    deposit = get_lease_deposit(db, deposit_id)
    if not deposit:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(deposit, field, value)

    db.commit()
    db.refresh(deposit)
    return deposit


def delete_lease_deposit(db: Session, deposit_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    deposit = get_lease_deposit(db, deposit_id)
    if not deposit:
        return False
    soft_delete(db, deposit, deleted_by)
    return True
