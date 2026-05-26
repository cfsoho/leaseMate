from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RegionCreate(BaseModel):
    id: Optional[UUID] = None
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    is_active: bool = True
    sort_order: int = 0


class RegionUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class RegionRead(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
