from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.db.models.enums.user_status import UserStatus


class UserCreate(BaseModel):
    family_name: str
    given_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role_id: Optional[UUID] = None
    preferred_locale_code: Optional[str] = None


class UserUpdate(BaseModel):
    family_name: Optional[str] = None
    given_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[UUID] = None
    preferred_locale_code: Optional[str] = None
    status: Optional[UserStatus] = None


class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str


class UserRead(BaseModel):
    id: UUID
    family_name: str
    given_name: str
    email: EmailStr
    phone: Optional[str]
    role_id: Optional[UUID]
    preferred_locale_code: Optional[str]
    status: UserStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True