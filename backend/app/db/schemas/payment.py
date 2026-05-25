from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    lease_id: UUID

    amount_paid: Decimal
    currency_code: str = "THB"

    paid_at: datetime

    method: Optional[str] = None
    reference_no: Optional[str] = None

    received_by: Optional[UUID] = None

    note: Optional[str] = None


class PaymentUpdate(BaseModel):
    lease_id: Optional[UUID] = None

    amount_paid: Optional[Decimal] = None
    currency_code: Optional[str] = None

    paid_at: Optional[datetime] = None

    method: Optional[str] = None
    reference_no: Optional[str] = None

    received_by: Optional[UUID] = None

    note: Optional[str] = None


class PaymentRead(BaseModel):
    id: UUID

    lease_id: UUID

    amount_paid: Decimal
    currency_code: str

    paid_at: datetime

    method: Optional[str]
    reference_no: Optional[str]

    received_by: Optional[UUID]

    note: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True