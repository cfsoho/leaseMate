from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

class FinancialTransactionCreate(BaseModel):
    financial_account_id: UUID
    source_type: str
    source_id: Optional[UUID] = None

    transaction_date: date

    deposit_amount: Optional[Decimal] = None
    withdrawal_amount: Optional[Decimal] = None
    balance_after: Decimal

    currency_code: str = "THB"
    counterparty: Optional[str] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None


class FinancialTransactionUpdate(BaseModel):
    financial_account_id: Optional[UUID] = None
    source_type: Optional[str] = None
    source_id: Optional[UUID] = None

    transaction_date: Optional[date] = None

    deposit_amount: Optional[Decimal] = None
    withdrawal_amount: Optional[Decimal] = None
    balance_after: Optional[Decimal] = None

    currency_code: Optional[str] = None
    counterparty: Optional[str] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None


class FinancialTransactionRead(BaseModel):
    id: UUID

    financial_account_id: UUID
    source_type: str
    source_id: Optional[UUID]

    transaction_date: date

    deposit_amount: Optional[Decimal]
    withdrawal_amount: Optional[Decimal]
    balance_after: Decimal

    currency_code: str
    counterparty: Optional[str]
    reference_no: Optional[str]
    notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
