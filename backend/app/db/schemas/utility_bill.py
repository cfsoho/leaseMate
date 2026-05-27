from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class UtilityBillCreate(BaseModel):
    property_id: UUID
    utility_type_id: UUID

    billing_year: int
    billing_month: int

    amount: Decimal
    currency_code: str = "THB"

    due_date: Optional[date] = None
    paid_date: Optional[date] = None

    meter_start: Optional[Decimal] = None
    meter_end: Optional[Decimal] = None

    status_id: Optional[UUID] = None
    notes: Optional[str] = None


class UtilityBillUpdate(BaseModel):
    property_id: Optional[UUID] = None
    utility_type_id: Optional[UUID] = None

    billing_year: Optional[int] = None
    billing_month: Optional[int] = None

    amount: Optional[Decimal] = None
    currency_code: Optional[str] = None

    due_date: Optional[date] = None
    paid_date: Optional[date] = None

    meter_start: Optional[Decimal] = None
    meter_end: Optional[Decimal] = None

    status_id: Optional[UUID] = None
    notes: Optional[str] = None


class UtilityBillRead(BaseModel):
    id: UUID

    property_id: UUID
    utility_type_id: UUID

    billing_year: int
    billing_month: int

    amount: Decimal
    currency_code: str

    due_date: Optional[date]
    paid_date: Optional[date]

    meter_start: Optional[Decimal]
    meter_end: Optional[Decimal]

    status_id: UUID
    notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True