from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.tax_record import TaxRecord
from app.db.schemas.tax_record import TaxRecordCreate, TaxRecordUpdate


def create_tax_record(db: Session, payload: TaxRecordCreate) -> TaxRecord:
    tax_record = TaxRecord(**payload.model_dump())

    db.add(tax_record)
    db.commit()
    db.refresh(tax_record)

    return tax_record


def get_tax_record(db: Session, tax_record_id: UUID) -> Optional[TaxRecord]:
    return (
        db.query(TaxRecord)
        .filter(TaxRecord.id == tax_record_id)
        .first()
    )


def get_tax_records(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(TaxRecord)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_tax_record(
    db: Session,
    tax_record_id: UUID,
    payload: TaxRecordUpdate
) -> Optional[TaxRecord]:
    tax_record = get_tax_record(db, tax_record_id)

    if not tax_record:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(tax_record, field, value)

    db.commit()
    db.refresh(tax_record)

    return tax_record


def delete_tax_record(db: Session, tax_record_id: UUID) -> bool:
    tax_record = get_tax_record(db, tax_record_id)

    if not tax_record:
        return False

    db.delete(tax_record)
    db.commit()

    return True