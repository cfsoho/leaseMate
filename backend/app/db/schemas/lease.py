from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.db.models.ref.status_code import STATUS_CODE_IDS


class LeaseCreate(BaseModel):
    property_id: UUID
    landlord_id: UUID
    tenant_id: Optional[UUID] = None
    agent_id: Optional[UUID] = None

    start_date: date
    end_date: date

    rent_amount: Decimal
    rent_currency: str = "THB"

    deposit_amount: Optional[Decimal] = None
    deposit_currency: Optional[str] = None

    due_day: int = 1
    payment_cycle: int = 1

    status_id: UUID = STATUS_CODE_IDS["LEASE_DRAFT"]


class LeaseUpdate(BaseModel):
    property_id: Optional[UUID] = None
    landlord_id: Optional[UUID] = None
    tenant_id: Optional[UUID] = None
    agent_id: Optional[UUID] = None

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    rent_amount: Optional[Decimal] = None
    rent_currency: Optional[str] = None

    deposit_amount: Optional[Decimal] = None
    deposit_currency: Optional[str] = None

    due_day: Optional[int] = None
    payment_cycle: Optional[int] = None

    status_id: Optional[UUID] = None


class LeaseRead(BaseModel):
    id: UUID

    property_id: UUID
    landlord_id: UUID
    tenant_id: Optional[UUID]
    agent_id: Optional[UUID]

    start_date: date
    end_date: date

    rent_amount: Decimal
    rent_currency: str

    deposit_amount: Optional[Decimal]
    deposit_currency: Optional[str]

    due_day: int
    payment_cycle: int

    status_id: UUID

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True