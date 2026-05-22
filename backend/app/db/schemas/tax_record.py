from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class TaxRecordCreate(BaseModel):
    property_id: UUID
    country_id: UUID

    tax_year: int
    tax_type_code: str

    currency_code: str = "THB"

    declared_amount: Optional[Decimal] = None
    paid_amount: Optional[Decimal] = None
    paid_date: Optional[date] = None

    notes: Optional[str] = None


class TaxRecordUpdate(BaseModel):
    property_id: Optional[UUID] = None
    country_id: Optional[UUID] = None

    tax_year: Optional[int] = None
    tax_type_code: Optional[str] = None

    currency_code: Optional[str] = None

    declared_amount: Optional[Decimal] = None
    paid_amount: Optional[Decimal] = None
    paid_date: Optional[date] = None

    notes: Optional[str] = None


class TaxRecordRead(BaseModel):
    id: UUID

    property_id: UUID
    country_id: UUID

    tax_year: int
    tax_type_code: str

    currency_code: str

    declared_amount: Optional[Decimal]
    paid_amount: Optional[Decimal]
    paid_date: Optional[date]

    notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True