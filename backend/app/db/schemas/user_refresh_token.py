from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserRefreshTokenCreate(BaseModel):
    user_id: UUID
    token_hash: str
    expires_at: datetime
    device_info: Optional[str] = None
    ip_address: Optional[str] = None


class UserRefreshTokenRead(BaseModel):
    id: UUID
    user_id: UUID
    expires_at: datetime
    revoked_at: Optional[datetime]
    device_info: Optional[str]
    ip_address: Optional[str]
    last_used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True