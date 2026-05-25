from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.financial_institution_branch import (
    FinancialInstitutionBranchCreate,
    FinancialInstitutionBranchUpdate,
    FinancialInstitutionBranchRead,
)
from app.services.ref.financial_institution_branch_service import (
    create_financial_institution_branch,
    get_financial_institution_branch,
    get_financial_institution_branches,
    update_financial_institution_branch,
    delete_financial_institution_branch,
)

router = APIRouter(
    prefix="/financial-institution-branches",
    tags=["Financial Institution Branches"],
    dependencies=[Depends(require_admin)]
)


@router.post("", response_model=FinancialInstitutionBranchRead)
def create(payload: FinancialInstitutionBranchCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    return create_financial_institution_branch(db, payload)


@router.get("", response_model=List[FinancialInstitutionBranchRead])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_financial_institution_branches(db, skip, limit)


@router.get("/{branch_id}", response_model=FinancialInstitutionBranchRead)
def get_one(branch_id: UUID, db: Session = Depends(get_db)):
    branch = get_financial_institution_branch(db, branch_id)

    if not branch:
        raise HTTPException(status_code=404, detail="Financial institution branch not found")

    return branch


@router.put("/{branch_id}", response_model=FinancialInstitutionBranchRead)
def update(
    branch_id: UUID,
    payload: FinancialInstitutionBranchUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    branch = update_financial_institution_branch(db, branch_id, payload)

    if not branch:
        raise HTTPException(status_code=404, detail="Financial institution branch not found")

    return branch


@router.delete("/{branch_id}")
def delete(
    branch_id: UUID,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_financial_institution_branch(db, branch_id, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Financial institution branch not found")

    return {"message": "Financial institution branch deleted successfully"}