from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.financial_institution import FinancialInstitution
from app.db.schemas.financial_institution import (
    FinancialInstitutionCreate,
    FinancialInstitutionUpdate,
)


def create_financial_institution(db: Session, payload: FinancialInstitutionCreate) -> FinancialInstitution:
    institution = FinancialInstitution(**payload.model_dump())

    db.add(institution)
    db.commit()
    db.refresh(institution)

    return institution


def get_financial_institution(db: Session, institution_id: UUID) -> Optional[FinancialInstitution]:
    return (
        db.query(FinancialInstitution)
        .filter(FinancialInstitution.id == institution_id)
        .first()
    )


def get_financial_institutions(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(FinancialInstitution)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_financial_institution(
    db: Session,
    institution_id: UUID,
    payload: FinancialInstitutionUpdate
) -> Optional[FinancialInstitution]:
    institution = get_financial_institution(db, institution_id)

    if not institution:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(institution, field, value)

    db.commit()
    db.refresh(institution)

    return institution


def delete_financial_institution(db: Session, institution_id: UUID) -> bool:
    institution = get_financial_institution(db, institution_id)

    if not institution:
        return False

    db.delete(institution)
    db.commit()

    return True