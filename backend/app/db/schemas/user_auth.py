from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class BootstrapStatusResponse(BaseModel):
    admin_exists: bool
    bootstrap_required: bool


class BootstrapLocaleResponse(BaseModel):
    code: str
    name: str
    native_name: Optional[str] = None
    name_order: str
    name_format_mask: str


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str
    family_name: str
    given_name: str
    phone: Optional[str] = None
    preferred_locale_code: Optional[str] = None


class BootstrapAdminResponse(BaseModel):
    user_id: UUID
    email: EmailStr
    status: str
    email_sent: bool
    verification_token_expires_at: datetime
    verification_url: str
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class EmailVerificationResendResponse(BaseModel):
    already_verified: bool
    email_sent: bool
    verification_token_expires_at: Optional[datetime] = None
    verification_url: Optional[str] = None


class EmailVerificationResendRequest(BaseModel):
    user_id: Optional[UUID] = None
    token_id: Optional[UUID] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class EmailConfirmationResponse(BaseModel):
    user: "UserRead"
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class CurrentUserLegalNamePayload(BaseModel):
    country_id: UUID
    locale_code: str
    full_name: str


from app.db.schemas.user import UserRead

EmailConfirmationResponse.model_rebuild()
