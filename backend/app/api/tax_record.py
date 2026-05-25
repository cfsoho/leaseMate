from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.tax_record import (
    TaxRecordCreate,
    TaxRecordUpdate,
    TaxRecordRead,
)
from app.services.tax_record_service import (
    create_tax_record,
    get_tax_record,
    get_tax_records,
    update_tax_record,
    delete_tax_record,
)

router = APIRouter(
    prefix="/tax-records",
    tags=["Tax Records"],
    dependencies=[Depends(require_current_user)]
)


@router.post("", response_model=TaxRecordRead)
def create(
    payload: TaxRecordCreate,
    db: Session = Depends(get_db)
):
    return create_tax_record(db, payload)


@router.get("", response_model=List[TaxRecordRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_tax_records(db, skip, limit)


@router.get("/{tax_record_id}", response_model=TaxRecordRead)
def get_one(
    tax_record_id: UUID,
    db: Session = Depends(get_db)
):
    tax_record = get_tax_record(db, tax_record_id)

    if not tax_record:
        raise HTTPException(
            status_code=404,
            detail="Tax record not found"
        )

    return tax_record


@router.put("/{tax_record_id}", response_model=TaxRecordRead)
def update(
    tax_record_id: UUID,
    payload: TaxRecordUpdate,
    db: Session = Depends(get_db)
):
    tax_record = update_tax_record(
        db,
        tax_record_id,
        payload
    )

    if not tax_record:
        raise HTTPException(
            status_code=404,
            detail="Tax record not found"
        )

    return tax_record


@router.delete("/{tax_record_id}")
def delete(
    tax_record_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_tax_record(db, tax_record_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Tax record not found"
        )

    return {
        "message": "Tax record deleted successfully"
    }