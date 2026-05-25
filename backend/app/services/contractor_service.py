from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.contractor import Contractor
from app.db.schemas.contractor import ContractorCreate, ContractorUpdate

from app.services.soft_delete import soft_delete

def create_contractor(db: Session, payload: ContractorCreate) -> Contractor:
    contractor = Contractor(**payload.model_dump())

    db.add(contractor)
    db.commit()
    db.refresh(contractor)

    return contractor


def get_contractor(db: Session, contractor_id: UUID) -> Optional[Contractor]:
    return (
        db.query(Contractor)
        .filter(Contractor.id == contractor_id)
        .first()
    )


def get_contractors(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Contractor)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_contractor(
    db: Session,
    contractor_id: UUID,
    payload: ContractorUpdate
) -> Optional[Contractor]:
    contractor = get_contractor(db, contractor_id)

    if not contractor:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(contractor, field, value)

    db.commit()
    db.refresh(contractor)

    return contractor


def delete_contractor(db: Session, contractor_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    contractor = get_contractor(db, contractor_id)

    if not contractor:
        return False
    soft_delete(db, contractor, deleted_by)

    return True