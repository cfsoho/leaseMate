from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

class PropertyAccessLevelCreate(BaseModel):
    id: Optional[UUID] = None

    locale: str

    code: str

    name: str
    description: Optional[str] = None

    allow_multiple: bool = True
    record_readonly: bool = True
    record_writable: bool = False
    record_deletable: bool = False
    sort_order: int = 0

    is_active: bool = True


class PropertyAccessLevelUpdate(BaseModel):
    locale: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    allow_multiple: Optional[bool] = None
    record_readonly: Optional[bool] = None
    record_writable: Optional[bool] = None
    record_deletable: Optional[bool] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class PropertyAccessLevelRead(BaseModel):
    id: UUID

    locale: str

    code: str

    name: str
    description: Optional[str]

    allow_multiple: bool
    record_readonly: bool
    record_writable: bool
    record_deletable: bool
    sort_order: int

    is_active: bool

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
