from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RefCodeCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True
    is_income: Optional[bool] = None


class RefCodeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_income: Optional[bool] = None


class RefCodeRead(BaseModel):
    code: str
    name: str
    description: Optional[str]
    is_active: bool
    is_income: Optional[bool] = None
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
