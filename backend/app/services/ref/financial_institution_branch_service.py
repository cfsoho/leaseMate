from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.financial_institution_branch import FinancialInstitutionBranch
from app.db.models.ref.financial_institution import FinancialInstitution
from app.db.models.ref.country import Country
from app.db.schemas.ref.financial_institution_branch import (
    FinancialInstitutionBranchCreate,
    FinancialInstitutionBranchUpdate,
)

from app.services.soft_delete import soft_delete

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
    branch_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    branch = get_financial_institution_branch(db, branch_id)

    if not branch:
        return False
    soft_delete(db, branch, deleted_by)

    return True


def upsert_financial_institution_branches_from_list(
    db: Session,
    institutions: list[dict]
) -> list[FinancialInstitutionBranch]:
    upserted = []

    for item in institutions:
        country = (
            db.query(Country)
            .filter(Country.code == item["country_code"])
            .first()
        )

        if not country:
            raise ValueError(
                f"Country code not found for financial institution branch: "
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

        if not institution:
            raise ValueError(
                f"Financial institution not found for branch seed: "
                f"{item['name']}"
            )

        seeded_branch_names = {
            branch_item["branch_name"]
            for branch_item in item.get("branches", [])
        }

        (
            db.query(FinancialInstitutionBranch)
            .filter(
                FinancialInstitutionBranch.financial_institution_id == institution.id,
                ~FinancialInstitutionBranch.branch_name.in_(seeded_branch_names),
            )
            .update({"is_active": False}, synchronize_session=False)
        )

        for branch_item in item.get("branches", []):
            branch = (
                db.query(FinancialInstitutionBranch)
                .filter(
                    FinancialInstitutionBranch.financial_institution_id == institution.id,
                    FinancialInstitutionBranch.branch_name == branch_item["branch_name"],
                )
                .first()
            )

            data = {
                "financial_institution_id": institution.id,
                "branch_name": branch_item["branch_name"],
                "branch_code": branch_item.get("branch_code"),
                "address": branch_item.get("address"),
                "phone": branch_item.get("phone"),
                "is_active": branch_item.get("is_active", True),
            }

            if branch:
                for field, value in data.items():
                    setattr(branch, field, value)
            else:
                branch = FinancialInstitutionBranch(**data)
                db.add(branch)

            upserted.append(branch)

    db.commit()

    for branch in upserted:
        db.refresh(branch)

    return upserted
