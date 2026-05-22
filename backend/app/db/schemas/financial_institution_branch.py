from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FinancialInstitutionBranchCreate(BaseModel):
    financial_institution_id: UUID
    branch_name: str
    branch_code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True


class FinancialInstitutionBranchUpdate(BaseModel):
    financial_institution_id: Optional[UUID] = None
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class FinancialInstitutionBranchRead(BaseModel):
    id: UUID
    financial_institution_id: UUID
    branch_name: str
    branch_code: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True