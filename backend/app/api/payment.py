from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentRead,
)

from app.services.payment_service import (
    create_payment,
    get_payment,
    get_payments,
    update_payment,
    delete_payment,
)

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.post("", response_model=PaymentRead)
def create(
    payload: PaymentCreate,
    db: Session = Depends(get_db)
):
    return create_payment(db, payload)


@router.get("", response_model=List[PaymentRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_payments(db, skip, limit)


@router.get("/{payment_id}", response_model=PaymentRead)
def get_one(
    payment_id: UUID,
    db: Session = Depends(get_db)
):
    payment = get_payment(db, payment_id)

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


@router.put("/{payment_id}", response_model=PaymentRead)
def update(
    payment_id: UUID,
    payload: PaymentUpdate,
    db: Session = Depends(get_db)
):
    payment = update_payment(db, payment_id, payload)

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


@router.delete("/{payment_id}")
def delete(
    payment_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_payment(db, payment_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return {
        "message": "Payment deleted successfully"
    }