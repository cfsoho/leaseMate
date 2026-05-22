from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.payment import Payment
from app.db.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
)


def create_payment(
    db: Session,
    payload: PaymentCreate
) -> Payment:

    payment = Payment(**payload.model_dump())

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


def get_payment(
    db: Session,
    payment_id: UUID
) -> Optional[Payment]:

    return (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )


def get_payments(
    db: Session,
    skip: int = 0,
    limit: int = 100
):

    return (
        db.query(Payment)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_payment(
    db: Session,
    payment_id: UUID,
    payload: PaymentUpdate
) -> Optional[Payment]:

    payment = get_payment(db, payment_id)

    if not payment:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(payment, field, value)

    db.commit()
    db.refresh(payment)

    return payment


def delete_payment(
    db: Session,
    payment_id: UUID
) -> bool:

    payment = get_payment(db, payment_id)

    if not payment:
        return False

    db.delete(payment)
    db.commit()

    return True