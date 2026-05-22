from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PropertyAccessCreate(BaseModel):
    property_id: UUID
    user_id: UUID
    access_level_id: UUID


class PropertyAccessUpdate(BaseModel):
    access_level_id: Optional[UUID] = None


class PropertyAccessRead(BaseModel):
    id: UUID

    property_id: UUID
    user_id: UUID
    access_level_id: UUID

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True