from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.db.models.ref.status_code import STATUS_CODE_IDS


class LeaseDepositCreate(BaseModel):
    lease_id: UUID
    deposit_type: str = "security"
    amount_due: Decimal
    amount_received: Optional[Decimal] = None
    currency_code: str = "THB"
    due_date: Optional[date] = None
    received_date: Optional[date] = None
    deduction_amount: Optional[Decimal] = None
    refund_amount: Optional[Decimal] = None
    refund_date: Optional[date] = None
    status_id: UUID = STATUS_CODE_IDS["DEPOSIT_PENDING"]
    notes: Optional[str] = None


class LeaseDepositUpdate(BaseModel):
    lease_id: Optional[UUID] = None
    deposit_type: Optional[str] = None
    amount_due: Optional[Decimal] = None
    amount_received: Optional[Decimal] = None
    currency_code: Optional[str] = None
    due_date: Optional[date] = None
    received_date: Optional[date] = None
    deduction_amount: Optional[Decimal] = None
    refund_amount: Optional[Decimal] = None
    refund_date: Optional[date] = None
    status_id: Optional[UUID] = None
    notes: Optional[str] = None


class LeaseDepositRead(BaseModel):
    id: UUID
    lease_id: UUID
    deposit_type: str
    amount_due: Decimal
    amount_received: Optional[Decimal]
    currency_code: str
    due_date: Optional[date]
    received_date: Optional[date]
    deduction_amount: Optional[Decimal]
    refund_amount: Optional[Decimal]
    refund_date: Optional[date]
    status_id: UUID
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
