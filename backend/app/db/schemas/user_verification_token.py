from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.models.enums.user_verification_token_type import (
    UserVerificationTokenType,
)


class UserVerificationTokenCreate(BaseModel):
    user_id: UUID
    token_type: UserVerificationTokenType
    expires_at: datetime


class UserVerificationTokenRead(BaseModel):
    id: UUID
    user_id: UUID
    token_type: UserVerificationTokenType
    expires_at: datetime
    used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True