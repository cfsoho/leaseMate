from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class RecurringExpenseScheduleCreate(BaseModel):
    property_id: UUID
    expense_type_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None
    amount: Decimal
    currency_code: str = "THB"
    frequency: str = "monthly"
    interval_count: int = 1
    start_date: date
    end_date: Optional[date] = None
    next_due_date: date
    auto_create_expense: bool = False
    description: Optional[str] = None
    status_id: Optional[UUID] = None


class RecurringExpenseScheduleUpdate(BaseModel):
    property_id: Optional[UUID] = None
    expense_type_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None
    amount: Optional[Decimal] = None
    currency_code: Optional[str] = None
    frequency: Optional[str] = None
    interval_count: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    next_due_date: Optional[date] = None
    auto_create_expense: Optional[bool] = None
    description: Optional[str] = None
    status_id: Optional[UUID] = None


class RecurringExpenseScheduleRead(BaseModel):
    id: UUID
    property_id: UUID
    expense_type_id: Optional[UUID]
    contractor_id: Optional[UUID]
    amount: Decimal
    currency_code: str
    frequency: str
    interval_count: int
    start_date: date
    end_date: Optional[date]
    next_due_date: date
    auto_create_expense: bool
    description: Optional[str]
    status_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
