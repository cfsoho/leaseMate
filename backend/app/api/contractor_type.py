from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.contractor_type import (
    ContractorTypeCreate,
    ContractorTypeUpdate,
    ContractorTypeRead,
)
from app.services.contractor_type_service import (
    create_contractor_type,
    get_contractor_type,
    get_contractor_types,
    update_contractor_type,
    delete_contractor_type,
)

router = APIRouter(
    prefix="/contractor-types",
    tags=["Contractor Types"]
)


@router.post("", response_model=ContractorTypeRead)
def create(
    payload: ContractorTypeCreate,
    db: Session = Depends(get_db)
):
    return create_contractor_type(db, payload)


@router.get("", response_model=List[ContractorTypeRead])
def list_all(
    locale: str = "en",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_contractor_types(db, locale, skip, limit)


@router.get("/{contractor_type_id}/{locale}", response_model=ContractorTypeRead)
def get_one(
    contractor_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    contractor_type = get_contractor_type(db, contractor_type_id, locale)

    if not contractor_type:
        raise HTTPException(status_code=404, detail="Contractor type not found")

    return contractor_type


@router.put("/{contractor_type_id}/{locale}", response_model=ContractorTypeRead)
def update(
    contractor_type_id: UUID,
    locale: str,
    payload: ContractorTypeUpdate,
    db: Session = Depends(get_db)
):
    contractor_type = update_contractor_type(
        db,
        contractor_type_id,
        locale,
        payload
    )

    if not contractor_type:
        raise HTTPException(status_code=404, detail="Contractor type not found")

    return contractor_type


@router.delete("/{contractor_type_id}/{locale}")
def delete(
    contractor_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    deleted = delete_contractor_type(db, contractor_type_id, locale)

    if not deleted:
        raise HTTPException(status_code=404, detail="Contractor type not found")

    return {"message": "Contractor type deleted successfully"}