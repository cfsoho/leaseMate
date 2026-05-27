from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StatusCodeCreate(BaseModel):
    id: Optional[UUID] = None
    locale: str
    group_code: str
    code: str
    name: str
    description: Optional[str] = None
    is_terminal: bool = False
    is_success: bool = False
    is_active: bool = True
    sort_order: int = 0


class StatusCodeUpdate(BaseModel):
    locale: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_terminal: Optional[bool] = None
    is_success: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class StatusCodeRead(BaseModel):
    id: UUID
    locale: str
    group_code: str
    code: str
    name: str
    description: Optional[str]
    is_terminal: bool
    is_success: bool
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime]
    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
