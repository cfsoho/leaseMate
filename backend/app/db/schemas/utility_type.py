from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UtilityTypeCreate(BaseModel):
    id: Optional[UUID] = None
    locale: str
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class UtilityTypeUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class UtilityTypeRead(BaseModel):
    id: UUID
    locale: str
    code: str
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True