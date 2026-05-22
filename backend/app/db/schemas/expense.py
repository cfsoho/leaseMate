from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    property_id: UUID
    expense_type_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None

    quoted_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    description: Optional[str] = None
    status: str = "pending"


class ExpenseUpdate(BaseModel):
    property_id: Optional[UUID] = None
    expense_type_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None

    quoted_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    description: Optional[str] = None
    status: Optional[str] = None


class ExpenseRead(BaseModel):
    id: UUID

    property_id: UUID
    expense_type_id: Optional[UUID]
    contractor_id: Optional[UUID]

    quoted_amount: Optional[Decimal]
    actual_amount: Optional[Decimal]

    start_date: Optional[date]
    end_date: Optional[date]

    description: Optional[str]
    status: str

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True