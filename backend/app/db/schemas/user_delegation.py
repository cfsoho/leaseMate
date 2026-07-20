from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserDelegationBase(BaseModel):
    relationship_type: Optional[str] = Field(default=None, max_length=50)
    can_view_legal_names: bool = True
    can_manage_legal_names: bool = False
    can_view_bank_accounts: bool = False
    can_manage_bank_accounts: bool = False
    can_create_properties_for_subject: bool = False
    is_active: bool = True


class UserDelegationCreate(UserDelegationBase):
    delegate_user_id: UUID


class UserDelegationUpdate(BaseModel):
    relationship_type: Optional[str] = Field(default=None, max_length=50)
    can_view_legal_names: Optional[bool] = None
    can_manage_legal_names: Optional[bool] = None
    can_view_bank_accounts: Optional[bool] = None
    can_manage_bank_accounts: Optional[bool] = None
    can_create_properties_for_subject: Optional[bool] = None
    is_active: Optional[bool] = None


class UserDelegationRead(UserDelegationBase):
    id: UUID
    subject_user_id: UUID
    delegate_user_id: UUID
    subject_family_name: str
    subject_given_name: str
    subject_email: str
    delegate_family_name: str
    delegate_given_name: str
    delegate_email: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
