from uuid import UUID
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class BootstrapStatusResponse(BaseModel):
    admin_exists: bool
    bootstrap_required: bool


class SystemSetupStatusResponse(BaseModel):
    email_settings_ready: bool
    system_ready: bool


class BootstrapLocaleResponse(BaseModel):
    code: str
    name: str
    native_name: Optional[str] = None
    name_order: str
    name_format_mask: str


class BootstrapDefaultLocaleResponse(BaseModel):
    locale_code: str
    country_alpha2: Optional[str] = None


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
    verification_token_expires_at: Optional[datetime] = None
    verification_url: Optional[str] = None
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


class PasskeyOptionsResponse(BaseModel):
    options: dict[str, Any]


class PasskeyRegistrationVerifyRequest(BaseModel):
    credential: dict[str, Any]
    name: Optional[str] = None


class PasskeyAuthenticationOptionsRequest(BaseModel):
    email: Optional[EmailStr] = None


class PasskeyAuthenticationVerifyRequest(BaseModel):
    credential: dict[str, Any]


class UserPasskeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: Optional[str] = None
    device_type: Optional[str] = None
    backed_up: bool
    transports: Optional[str] = None
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime


class UserLoginSessionResponse(BaseModel):
    id: UUID
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    location_country_code: Optional[str] = None
    location_region: Optional[str] = None
    location_city: Optional[str] = None
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime
    is_current: bool = False
    is_online: bool = False
    session_status: str = "offline"


class LogoutSessionsRequest(BaseModel):
    refresh_token: Optional[str] = None


class EmailConfirmationResponse(BaseModel):
    user: "UserRead"
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserReadinessResponse(BaseModel):
    legal_name_count: int
    property_count: int
    financial_account_count: int


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    email_sent: bool
    password_reset_token_expires_at: Optional[datetime] = None
    reset_url: Optional[str] = None
    message: str


class PasswordResetTokenStatusResponse(BaseModel):
    valid: bool
    status: str
    email: Optional[EmailStr] = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    password_reset: bool
    message: str


class CurrentUserLegalNamePayload(BaseModel):
    country_id: UUID
    locale_code: str
    full_name: str


from app.db.schemas.user import UserRead

EmailConfirmationResponse.model_rebuild()
