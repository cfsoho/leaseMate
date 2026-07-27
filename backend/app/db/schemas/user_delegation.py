from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


ACCESS_FIELD_NAMES = (
    "can_view_legal_names",
    "can_manage_legal_names",
    "can_view_bank_accounts",
    "can_manage_bank_accounts",
    "can_view_user_account_info",
    "can_manage_user_account_info",
    "can_view_properties",
    "can_manage_properties",
)


class UserDelegationBase(BaseModel):
    relationship_type: str = Field(..., min_length=1, max_length=50)
    can_view_legal_names: bool = False
    can_manage_legal_names: bool = False
    can_view_bank_accounts: bool = False
    can_manage_bank_accounts: bool = False
    can_view_user_account_info: bool = False
    can_manage_user_account_info: bool = False
    can_view_properties: bool = False
    can_manage_properties: bool = False
    is_active: bool = True

    @field_validator("relationship_type")
    @classmethod
    def validate_relationship_type(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Relationship is required")
        return trimmed

    @model_validator(mode="after")
    def validate_allowed_access(self):
        if not any(getattr(self, field_name) for field_name in ACCESS_FIELD_NAMES):
            raise ValueError("Select at least one allowed access")
        return self


class UserDelegationCreate(UserDelegationBase):
    delegate_user_id: UUID


class UserDelegationUpdate(BaseModel):
    relationship_type: Optional[str] = Field(default=None, min_length=1, max_length=50)
    can_view_legal_names: Optional[bool] = None
    can_manage_legal_names: Optional[bool] = None
    can_view_bank_accounts: Optional[bool] = None
    can_manage_bank_accounts: Optional[bool] = None
    can_view_user_account_info: Optional[bool] = None
    can_manage_user_account_info: Optional[bool] = None
    can_view_properties: Optional[bool] = None
    can_manage_properties: Optional[bool] = None
    is_active: Optional[bool] = None

    @field_validator("relationship_type")
    @classmethod
    def validate_relationship_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Relationship is required")
        return trimmed


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
