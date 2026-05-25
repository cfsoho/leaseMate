from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

class UserVerificationTokenCreate(BaseModel):
    user_id: UUID
    token_type: str
    expires_at: datetime


class UserVerificationTokenRead(BaseModel):
    id: UUID
    user_id: UUID
    token_type: str
    expires_at: datetime
    used_at: Optional[datetime]
    created_at: datetime

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
