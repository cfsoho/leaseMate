from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.models.enums.property_access_level_code import (
    PropertyAccessLevelCode
)


class PropertyAccessLevelCreate(BaseModel):
    id: Optional[UUID] = None

    locale: str

    code: PropertyAccessLevelCode

    name: str
    description: Optional[str] = None

    is_active: bool = True


class PropertyAccessLevelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PropertyAccessLevelRead(BaseModel):
    id: UUID

    locale: str

    code: PropertyAccessLevelCode

    name: str
    description: Optional[str]

    is_active: bool

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True