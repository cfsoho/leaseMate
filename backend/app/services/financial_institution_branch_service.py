from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.financial_institution_branch import FinancialInstitutionBranch
from app.db.schemas.financial_institution_branch import (
    FinancialInstitutionBranchCreate,
    FinancialInstitutionBranchUpdate,
)


def create_financial_institution_branch(
    db: Session,
    payload: FinancialInstitutionBranchCreate
) -> FinancialInstitutionBranch:
    branch = FinancialInstitutionBranch(**payload.model_dump())

    db.add(branch)
    db.commit()
    db.refresh(branch)

    return branch


def get_financial_institution_branch(
    db: Session,
    branch_id: UUID
) -> Optional[FinancialInstitutionBranch]:
    return (
        db.query(FinancialInstitutionBranch)
        .filter(FinancialInstitutionBranch.id == branch_id)
        .first()
    )


def get_financial_institution_branches(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(FinancialInstitutionBranch)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_financial_institution_branch(
    db: Session,
    branch_id: UUID,
    payload: FinancialInstitutionBranchUpdate
) -> Optional[FinancialInstitutionBranch]:
    branch = get_financial_institution_branch(db, branch_id)

    if not branch:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(branch, field, value)

    db.commit()
    db.refresh(branch)

    return branch


def delete_financial_institution_branch(
    db: Session,
    branch_id: UUID
) -> bool:
    branch = get_financial_institution_branch(db, branch_id)

    if not branch:
        return False

    db.delete(branch)
    db.commit()

    return True