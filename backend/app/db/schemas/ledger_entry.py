from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

class LedgerEntryCreate(BaseModel):
    property_id: UUID

    entry_type: str
    entry_date: date

    amount: Decimal
    currency_code: str = "THB"

    is_income: bool = False

    source_type: Optional[str] = None
    source_id: Optional[UUID] = None

    notes: Optional[str] = None


class LedgerEntryUpdate(BaseModel):
    property_id: Optional[UUID] = None

    entry_type: Optional[str] = None
    entry_date: Optional[date] = None

    amount: Optional[Decimal] = None
    currency_code: Optional[str] = None

    is_income: Optional[bool] = None

    source_type: Optional[str] = None
    source_id: Optional[UUID] = None

    notes: Optional[str] = None


class LedgerEntryRead(BaseModel):
    id: UUID

    property_id: UUID

    entry_type: str
    entry_date: date

    amount: Decimal
    currency_code: str

    is_income: bool

    source_type: Optional[str]
    source_id: Optional[UUID]

    notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
