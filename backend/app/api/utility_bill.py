from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.utility_bill import (
    UtilityBillCreate,
    UtilityBillUpdate,
    UtilityBillRead,
)
from app.services.utility_bill_service import (
    create_utility_bill,
    get_utility_bill,
    get_utility_bills,
    update_utility_bill,
    delete_utility_bill,
)

router = APIRouter(
    prefix="/utility-bills",
    tags=["Utility Bills"],
    dependencies=[Depends(require_current_user)]
)


@router.post("", response_model=UtilityBillRead)
def create(
    payload: UtilityBillCreate,
    db: Session = Depends(get_db)
):
    return create_utility_bill(db, payload)


@router.get("", response_model=List[UtilityBillRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_utility_bills(db, skip, limit)


@router.get("/{utility_bill_id}", response_model=UtilityBillRead)
def get_one(
    utility_bill_id: UUID,
    db: Session = Depends(get_db)
):
    utility_bill = get_utility_bill(db, utility_bill_id)

    if not utility_bill:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    return utility_bill


@router.put("/{utility_bill_id}", response_model=UtilityBillRead)
def update(
    utility_bill_id: UUID,
    payload: UtilityBillUpdate,
    db: Session = Depends(get_db)
):
    utility_bill = update_utility_bill(
        db,
        utility_bill_id,
        payload
    )

    if not utility_bill:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    return utility_bill


@router.delete("/{utility_bill_id}")
def delete(
    utility_bill_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_utility_bill(db, utility_bill_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    return {
        "message": "Utility bill deleted successfully"
    }