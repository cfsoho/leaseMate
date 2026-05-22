from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.schemas.payment_coverage import (
    PaymentCoverageCreate,
    PaymentCoverageUpdate,
    PaymentCoverageRead,
)

from app.services.payment_coverage_service import (
    create_payment_coverage,
    get_payment_coverage,
    get_payment_coverages,
    update_payment_coverage,
    delete_payment_coverage,
)

router = APIRouter(
    prefix="/payment-coverages",
    tags=["Payment Coverages"]
)


@router.post("", response_model=PaymentCoverageRead)
def create(
    payload: PaymentCoverageCreate,
    db: Session = Depends(get_db)
):
    return create_payment_coverage(db, payload)


@router.get("", response_model=List[PaymentCoverageRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_payment_coverages(db, skip, limit)


@router.get("/{payment_coverage_id}", response_model=PaymentCoverageRead)
def get_one(
    payment_coverage_id: UUID,
    db: Session = Depends(get_db)
):
    payment_coverage = get_payment_coverage(db, payment_coverage_id)

    if not payment_coverage:
        raise HTTPException(
            status_code=404,
            detail="Payment coverage not found"
        )

    return payment_coverage


@router.put("/{payment_coverage_id}", response_model=PaymentCoverageRead)
def update(
    payment_coverage_id: UUID,
    payload: PaymentCoverageUpdate,
    db: Session = Depends(get_db)
):
    payment_coverage = update_payment_coverage(
        db,
        payment_coverage_id,
        payload
    )

    if not payment_coverage:
        raise HTTPException(
            status_code=404,
            detail="Payment coverage not found"
        )

    return payment_coverage


@router.delete("/{payment_coverage_id}")
def delete(
    payment_coverage_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_payment_coverage(db, payment_coverage_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Payment coverage not found"
        )

    return {
        "message": "Payment coverage deleted successfully"
    }