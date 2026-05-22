from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.schemas.contractor import (
    ContractorCreate,
    ContractorUpdate,
    ContractorRead,
)

from app.services.contractor_service import (
    create_contractor,
    get_contractor,
    get_contractors,
    update_contractor,
    delete_contractor,
)

router = APIRouter(
    prefix="/contractors",
    tags=["Contractors"]
)


@router.post("", response_model=ContractorRead)
def create(
    payload: ContractorCreate,
    db: Session = Depends(get_db)
):
    return create_contractor(db, payload)


@router.get("", response_model=List[ContractorRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_contractors(db, skip, limit)


@router.get("/{contractor_id}", response_model=ContractorRead)
def get_one(
    contractor_id: UUID,
    db: Session = Depends(get_db)
):
    contractor = get_contractor(db, contractor_id)

    if not contractor:
        raise HTTPException(
            status_code=404,
            detail="Contractor not found"
        )

    return contractor


@router.put("/{contractor_id}", response_model=ContractorRead)
def update(
    contractor_id: UUID,
    payload: ContractorUpdate,
    db: Session = Depends(get_db)
):
    contractor = update_contractor(
        db,
        contractor_id,
        payload
    )

    if not contractor:
        raise HTTPException(
            status_code=404,
            detail="Contractor not found"
        )

    return contractor


@router.delete("/{contractor_id}")
def delete(
    contractor_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_contractor(db, contractor_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Contractor not found"
        )

    return {
        "message": "Contractor deleted successfully"
    }