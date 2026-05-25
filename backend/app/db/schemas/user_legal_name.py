from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserLegalNameCreate(BaseModel):
    user_id: UUID
    country_id: UUID
    locale_code: str
    full_name: str


class UserLegalNameUpdate(BaseModel):
    country_id: Optional[UUID] = None
    locale_code: Optional[str] = None
    full_name: Optional[str] = None


class UserLegalNameRead(BaseModel):
    id: UUID
    user_id: UUID
    country_id: UUID
    locale_code: str
    full_name: str
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True