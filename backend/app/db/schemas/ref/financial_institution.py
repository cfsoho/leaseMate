from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FinancialInstitutionCreate(BaseModel):
    country_id: UUID
    name: str
    swift_code: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True


class FinancialInstitutionUpdate(BaseModel):
    country_id: Optional[UUID] = None
    name: Optional[str] = None
    swift_code: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None


class FinancialInstitutionRead(BaseModel):
    id: UUID
    country_id: UUID
    name: str
    swift_code: Optional[str]
    website: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
