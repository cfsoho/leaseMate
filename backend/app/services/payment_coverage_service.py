from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.payment_coverage import PaymentCoverage

from app.db.schemas.payment_coverage import (
    PaymentCoverageCreate,
    PaymentCoverageUpdate,
)

from app.services.soft_delete import soft_delete

def create_payment_coverage(
    db: Session,
    payload: PaymentCoverageCreate
) -> PaymentCoverage:

    payment_coverage = PaymentCoverage(**payload.model_dump())

    db.add(payment_coverage)
    db.commit()
    db.refresh(payment_coverage)

    return payment_coverage


def get_payment_coverage(
    db: Session,
    payment_coverage_id: UUID
) -> Optional[PaymentCoverage]:

    return (
        db.query(PaymentCoverage)
        .filter(PaymentCoverage.id == payment_coverage_id)
        .first()
    )


def get_payment_coverages(
    db: Session,
    skip: int = 0,
    limit: int = 100
):

    return (
        db.query(PaymentCoverage)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_payment_coverage(
    db: Session,
    payment_coverage_id: UUID,
    payload: PaymentCoverageUpdate
) -> Optional[PaymentCoverage]:

    payment_coverage = get_payment_coverage(
        db,
        payment_coverage_id
    )

    if not payment_coverage:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(payment_coverage, field, value)

    db.commit()
    db.refresh(payment_coverage)

    return payment_coverage


def delete_payment_coverage(
    db: Session,
    payment_coverage_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:

    payment_coverage = get_payment_coverage(
        db,
        payment_coverage_id
    )

    if not payment_coverage:
        return False
    soft_delete(db, payment_coverage, deleted_by)

    return True