from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PaymentCoverageCreate(BaseModel):
    payment_id: UUID
    lease_id: UUID

    period_year: int
    period_month: int

    amount_applied: Decimal


class PaymentCoverageUpdate(BaseModel):
    payment_id: Optional[UUID] = None
    lease_id: Optional[UUID] = None

    period_year: Optional[int] = None
    period_month: Optional[int] = None

    amount_applied: Optional[Decimal] = None


class PaymentCoverageRead(BaseModel):
    id: UUID

    payment_id: UUID
    lease_id: UUID

    period_year: int
    period_month: int

    amount_applied: Decimal

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True