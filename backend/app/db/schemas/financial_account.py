from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class FinancialAccountCreate(BaseModel):
    user_id: Optional[UUID] = None
    legal_name_id: UUID
    financial_institution_branch_id: UUID
    account_number: str
    currency_code: str
    is_active: bool = True
    notes: Optional[str] = None


class FinancialAccountUpdate(BaseModel):
    user_id: Optional[UUID] = None
    legal_name_id: Optional[UUID] = None
    financial_institution_branch_id: Optional[UUID] = None
    account_number: Optional[str] = None
    currency_code: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class FinancialAccountRead(BaseModel):
    id: UUID
    user_id: UUID
    legal_name_id: Optional[UUID]
    financial_institution_branch_id: Optional[UUID]
    account_number: Optional[str]
    currency_code: str
    current_balance: Decimal
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
