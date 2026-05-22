from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.financial_institution import (
    FinancialInstitutionCreate,
    FinancialInstitutionUpdate,
    FinancialInstitutionRead,
)
from app.services.financial_institution_service import (
    create_financial_institution,
    get_financial_institution,
    get_financial_institutions,
    update_financial_institution,
    delete_financial_institution,
)

router = APIRouter(
    prefix="/financial-institutions",
    tags=["Financial Institutions"]
)


@router.post("", response_model=FinancialInstitutionRead)
def create(payload: FinancialInstitutionCreate, db: Session = Depends(get_db)):
    return create_financial_institution(db, payload)


@router.get("", response_model=List[FinancialInstitutionRead])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_financial_institutions(db, skip, limit)


@router.get("/{institution_id}", response_model=FinancialInstitutionRead)
def get_one(institution_id: UUID, db: Session = Depends(get_db)):
    institution = get_financial_institution(db, institution_id)

    if not institution:
        raise HTTPException(status_code=404, detail="Financial institution not found")

    return institution


@router.put("/{institution_id}", response_model=FinancialInstitutionRead)
def update(
    institution_id: UUID,
    payload: FinancialInstitutionUpdate,
    db: Session = Depends(get_db)
):
    institution = update_financial_institution(db, institution_id, payload)

    if not institution:
        raise HTTPException(status_code=404, detail="Financial institution not found")

    return institution


@router.delete("/{institution_id}")
def delete(institution_id: UUID, db: Session = Depends(get_db)):
    deleted = delete_financial_institution(db, institution_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Financial institution not found")

    return {"message": "Financial institution deleted successfully"}