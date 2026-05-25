from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

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
    status: Optional[str] = None


class UserPasswordChange(BaseModel):
    old_password: Optional[str] = None
    new_password: str


class UserRead(BaseModel):
    id: UUID
    family_name: str
    given_name: str
    email: EmailStr
    phone: Optional[str]
    role_id: Optional[UUID]
    preferred_locale_code: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
