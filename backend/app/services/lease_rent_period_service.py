from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.lease_rent_period import LeaseRentPeriod
from app.db.schemas.lease_rent_period import (
    LeaseRentPeriodCreate,
    LeaseRentPeriodUpdate,
)

from app.services.soft_delete import soft_delete
from app.services.status_defaults import apply_default_status

def create_lease_rent_period(db: Session, payload: LeaseRentPeriodCreate) -> LeaseRentPeriod:
    data = apply_default_status(
        db,
        payload.model_dump(),
        group_code="RENT_PERIOD",
        code="PENDING",
    )
    rent_period = LeaseRentPeriod(**data)
    db.add(rent_period)
    db.commit()
    db.refresh(rent_period)
    return rent_period


def get_lease_rent_period(db: Session, rent_period_id: UUID) -> Optional[LeaseRentPeriod]:
    return db.query(LeaseRentPeriod).filter(LeaseRentPeriod.id == rent_period_id).first()


def get_lease_rent_periods(db: Session, skip: int = 0, limit: int = 100):
    return db.query(LeaseRentPeriod).offset(skip).limit(limit).all()


def update_lease_rent_period(
    db: Session,
    rent_period_id: UUID,
    payload: LeaseRentPeriodUpdate
) -> Optional[LeaseRentPeriod]:
    rent_period = get_lease_rent_period(db, rent_period_id)
    if not rent_period:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rent_period, field, value)

    db.commit()
    db.refresh(rent_period)
    return rent_period


def delete_lease_rent_period(db: Session, rent_period_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    rent_period = get_lease_rent_period(db, rent_period_id)
    if not rent_period:
        return False
    soft_delete(db, rent_period, deleted_by)
    return True
