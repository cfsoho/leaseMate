from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.lease import (
    LeaseCreate,
    LeaseUpdate,
    LeaseRead,
)
from app.services.lease_service import (
    create_lease,
    get_lease,
    get_leases,
    update_lease,
    delete_lease,
)

router = APIRouter(
    prefix="/leases",
    tags=["Leases"]
)


@router.post("", response_model=LeaseRead)
def create(
    payload: LeaseCreate,
    db: Session = Depends(get_db)
):
    return create_lease(db, payload)


@router.get("", response_model=List[LeaseRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_leases(db, skip, limit)


@router.get("/{lease_id}", response_model=LeaseRead)
def get_one(
    lease_id: UUID,
    db: Session = Depends(get_db)
):
    lease = get_lease(db, lease_id)

    if not lease:
        raise HTTPException(
            status_code=404,
            detail="Lease not found"
        )

    return lease


@router.put("/{lease_id}", response_model=LeaseRead)
def update(
    lease_id: UUID,
    payload: LeaseUpdate,
    db: Session = Depends(get_db)
):
    lease = update_lease(db, lease_id, payload)

    if not lease:
        raise HTTPException(
            status_code=404,
            detail="Lease not found"
        )

    return lease


@router.delete("/{lease_id}")
def delete(
    lease_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_lease(db, lease_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Lease not found"
        )

    return {
        "message": "Lease deleted successfully"
    }