from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    family_name: str
    given_name: str
    email: EmailStr
    password: Optional[str] = None
    phone: Optional[str] = None
    phone_country_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    preferred_locale_code: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    family_name: Optional[str] = None
    given_name: Optional[str] = None
    phone: Optional[str] = None
    phone_country_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    preferred_locale_code: Optional[str] = None
    status: Optional[str] = None


class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    family_name: Optional[str] = None
    given_name: Optional[str] = None
    phone: Optional[str] = None
    phone_country_id: Optional[UUID] = None
    preferred_locale_code: Optional[str] = None


class UserPasswordChange(BaseModel):
    old_password: Optional[str] = None
    new_password: str


class UserRead(BaseModel):
    id: UUID
    family_name: str
    given_name: str
    email: EmailStr
    email_verified_at: Optional[datetime]
    password_must_change: bool
    phone: Optional[str]
    phone_country_id: Optional[UUID]
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


class UserPageRead(BaseModel):
    items: list[UserRead]
    total: int
    page: int
    page_size: int


class ActiveEmailLinkRead(BaseModel):
    id: UUID
    user_id: UUID
    family_name: str
    given_name: str
    email: EmailStr
    preferred_locale_code: Optional[str]
    expires_at: datetime
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class EmailLinkDashboardStats(BaseModel):
    active_link_count: int
    attention_required_count: int
    expiring_today_count: int


class UserLoginSessionRead(BaseModel):
    id: UUID
    user_id: UUID
    device_info: Optional[str]
    ip_address: Optional[str]
    created_at: Optional[datetime]
    last_used_at: Optional[datetime]
    expires_at: datetime
    revoked_at: Optional[datetime]

    class Config:
        from_attributes = True
