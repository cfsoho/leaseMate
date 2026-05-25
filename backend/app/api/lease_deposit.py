from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.lease_deposit import (
    LeaseDepositCreate,
    LeaseDepositRead,
    LeaseDepositUpdate,
)
from app.services.lease_deposit_service import (
    create_lease_deposit,
    delete_lease_deposit,
    get_lease_deposit,
    get_lease_deposits,
    update_lease_deposit,
)


router = APIRouter(prefix="/lease-deposits", tags=["Lease Deposits"], dependencies=[Depends(require_current_user)])


@router.post("", response_model=LeaseDepositRead)
def create(payload: LeaseDepositCreate, db: Session = Depends(get_db)):
    return create_lease_deposit(db, payload)


@router.get("", response_model=List[LeaseDepositRead])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_lease_deposits(db, skip, limit)


@router.get("/{deposit_id}", response_model=LeaseDepositRead)
def get_one(deposit_id: UUID, db: Session = Depends(get_db)):
    deposit = get_lease_deposit(db, deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Lease deposit not found")
    return deposit


@router.put("/{deposit_id}", response_model=LeaseDepositRead)
def update(
    deposit_id: UUID,
    payload: LeaseDepositUpdate,
    db: Session = Depends(get_db)
):
    deposit = update_lease_deposit(db, deposit_id, payload)
    if not deposit:
        raise HTTPException(status_code=404, detail="Lease deposit not found")
    return deposit


@router.delete("/{deposit_id}")
def delete(
    deposit_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_lease_deposit(db, deposit_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lease deposit not found")
    return {"message": "Lease deposit deleted successfully"}
