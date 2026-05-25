from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.financial_institution import FinancialInstitution
from app.db.models.ref.country import Country
from app.db.schemas.ref.financial_institution import (
    FinancialInstitutionCreate,
    FinancialInstitutionUpdate,
)

from app.services.soft_delete import soft_delete

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


def delete_financial_institution(db: Session, institution_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    institution = get_financial_institution(db, institution_id)

    if not institution:
        return False
    soft_delete(db, institution, deleted_by)

    return True


def upsert_financial_institutions_from_list(
    db: Session,
    institutions: list[dict]
) -> list[FinancialInstitution]:
    upserted = []

    for item in institutions:
        country = (
            db.query(Country)
            .filter(Country.code == item["country_code"])
            .first()
        )

        if not country:
            raise ValueError(
                f"Country code not found for financial institution: "
                f"{item['country_code']}"
            )

        institution = (
            db.query(FinancialInstitution)
            .filter(
                FinancialInstitution.country_id == country.id,
                FinancialInstitution.name == item["name"],
            )
            .first()
        )

        data = {
            "country_id": country.id,
            "name": item["name"],
            "swift_code": item.get("swift_code"),
            "website": item.get("website"),
            "is_active": item.get("is_active", True),
        }

        if institution:
            for field, value in data.items():
                setattr(institution, field, value)
        else:
            institution = FinancialInstitution(**data)
            db.add(institution)

        upserted.append(institution)

    db.commit()

    for institution in upserted:
        db.refresh(institution)

    return upserted
