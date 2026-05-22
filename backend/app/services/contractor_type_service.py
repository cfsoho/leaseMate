from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.contractor_type import ContractorType
from app.db.schemas.contractor_type import (
    ContractorTypeCreate,
    ContractorTypeUpdate,
)


def create_contractor_type(
    db: Session,
    payload: ContractorTypeCreate
) -> ContractorType:
    contractor_type = ContractorType(**payload.model_dump())

    db.add(contractor_type)
    db.commit()
    db.refresh(contractor_type)

    return contractor_type


def get_contractor_type(
    db: Session,
    contractor_type_id: UUID
) -> Optional[ContractorType]:
    return (
        db.query(ContractorType)
        .filter(ContractorType.id == contractor_type_id)
        .first()
    )


def get_contractor_types(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(ContractorType)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_contractor_type(
    db: Session,
    contractor_type_id: UUID,
    payload: ContractorTypeUpdate
) -> Optional[ContractorType]:
    contractor_type = get_contractor_type(db, contractor_type_id)

    if not contractor_type:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(contractor_type, field, value)

    db.commit()
    db.refresh(contractor_type)

    return contractor_type


def delete_contractor_type(
    db: Session,
    contractor_type_id: UUID
) -> bool:
    contractor_type = get_contractor_type(db, contractor_type_id)

    if not contractor_type:
        return False

    db.delete(contractor_type)
    db.commit()

    return True