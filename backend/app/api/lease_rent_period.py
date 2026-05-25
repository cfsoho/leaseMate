from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.lease_rent_period import (
    LeaseRentPeriodCreate,
    LeaseRentPeriodRead,
    LeaseRentPeriodUpdate,
)
from app.services.lease_rent_period_service import (
    create_lease_rent_period,
    delete_lease_rent_period,
    get_lease_rent_period,
    get_lease_rent_periods,
    update_lease_rent_period,
)


router = APIRouter(prefix="/lease-rent-periods", tags=["Lease Rent Periods"], dependencies=[Depends(require_current_user)])


@router.post("", response_model=LeaseRentPeriodRead)
def create(payload: LeaseRentPeriodCreate, db: Session = Depends(get_db)):
    return create_lease_rent_period(db, payload)


@router.get("", response_model=List[LeaseRentPeriodRead])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_lease_rent_periods(db, skip, limit)


@router.get("/{rent_period_id}", response_model=LeaseRentPeriodRead)
def get_one(rent_period_id: UUID, db: Session = Depends(get_db)):
    rent_period = get_lease_rent_period(db, rent_period_id)
    if not rent_period:
        raise HTTPException(status_code=404, detail="Lease rent period not found")
    return rent_period


@router.put("/{rent_period_id}", response_model=LeaseRentPeriodRead)
def update(
    rent_period_id: UUID,
    payload: LeaseRentPeriodUpdate,
    db: Session = Depends(get_db)
):
    rent_period = update_lease_rent_period(db, rent_period_id, payload)
    if not rent_period:
        raise HTTPException(status_code=404, detail="Lease rent period not found")
    return rent_period


@router.delete("/{rent_period_id}")
def delete(
    rent_period_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_lease_rent_period(db, rent_period_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lease rent period not found")
    return {"message": "Lease rent period deleted successfully"}
