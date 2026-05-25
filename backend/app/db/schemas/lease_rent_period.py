from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.db.models.ref.status_code import STATUS_CODE_IDS


class LeaseRentPeriodCreate(BaseModel):
    lease_id: UUID
    period_start: date
    period_end: date
    due_date: date
    rent_amount: Decimal
    currency_code: str = "THB"
    status_id: UUID = STATUS_CODE_IDS["RENT_PERIOD_PENDING"]
    notes: Optional[str] = None


class LeaseRentPeriodUpdate(BaseModel):
    lease_id: Optional[UUID] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    due_date: Optional[date] = None
    rent_amount: Optional[Decimal] = None
    currency_code: Optional[str] = None
    status_id: Optional[UUID] = None
    notes: Optional[str] = None


class LeaseRentPeriodRead(BaseModel):
    id: UUID
    lease_id: UUID
    period_start: date
    period_end: date
    due_date: date
    rent_amount: Decimal
    currency_code: str
    status_id: UUID
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
