from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class SystemEmailSettingsUpdate(BaseModel):
    smtp_host: Optional[str] = Field(default=None, max_length=255)
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_use_tls: bool = True

    noreply_user: Optional[str] = Field(default=None, max_length=255)
    noreply_password: Optional[str] = Field(default=None, max_length=1024)
    noreply_from: Optional[EmailStr] = None
    clear_noreply_password: bool = False

    system_user: Optional[str] = Field(default=None, max_length=255)
    system_password: Optional[str] = Field(default=None, max_length=1024)
    system_from: Optional[EmailStr] = None
    clear_system_password: bool = False


class SystemEmailSettingsRead(BaseModel):
    id: UUID
    smtp_host: Optional[str]
    smtp_port: Optional[int]
    smtp_use_tls: Optional[bool]

    noreply_user: Optional[str]
    noreply_from: Optional[EmailStr]
    noreply_password_set: bool

    system_user: Optional[str]
    system_from: Optional[EmailStr]
    system_password_set: bool
    is_complete: bool
    is_verified: bool
    is_ready: bool
    smtp_verified_at: Optional[datetime]
    smtp_verification_sent_at: Optional[datetime]
    smtp_verification_expires_at: Optional[datetime]
    smtp_last_tested_at: Optional[datetime]
    smtp_last_test_error: Optional[str]

    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SystemEmailSettingsStatus(BaseModel):
    smtp_host_set: bool
    noreply_configured: bool
    system_configured: bool
    is_complete: bool
    is_verified: bool
    is_ready: bool
    smtp_verified_at: Optional[datetime] = None
    smtp_verification_sent_at: Optional[datetime] = None
    smtp_verification_expires_at: Optional[datetime] = None
    smtp_last_tested_at: Optional[datetime] = None
    smtp_last_test_error: Optional[str] = None


class SystemEmailSettingsTestResponse(BaseModel):
    success: bool
    is_ready: bool
    smtp_verified_at: Optional[datetime] = None
    smtp_verification_sent_at: Optional[datetime] = None
    smtp_verification_expires_at: Optional[datetime] = None
    smtp_last_test_error: Optional[str] = None


StorageProvider = Literal["LOCAL_MOUNT", "S3"]


class SystemStorageSettingsUpdate(BaseModel):
    provider: StorageProvider
    local_folder: Optional[str] = Field(default=None, max_length=255)

    s3_bucket: Optional[str] = Field(default=None, max_length=255)
    s3_region: Optional[str] = Field(default=None, max_length=100)
    s3_endpoint_url: Optional[str] = Field(default=None, max_length=500)
    s3_base_prefix: Optional[str] = Field(default=None, max_length=500)
    s3_use_path_style: bool = False
    s3_access_key_id: Optional[str] = Field(default=None, max_length=255)
    s3_secret_access_key: Optional[str] = Field(default=None, max_length=1024)
    clear_s3_secret_access_key: bool = False


class SystemStorageSettingsRead(BaseModel):
    id: UUID
    provider: Optional[StorageProvider]
    local_folder: Optional[str]

    s3_bucket: Optional[str]
    s3_region: Optional[str]
    s3_endpoint_url: Optional[str]
    s3_base_prefix: Optional[str]
    s3_use_path_style: Optional[bool]
    s3_access_key_id: Optional[str]
    s3_secret_access_key_set: bool

    is_complete: bool
    is_verified: bool
    is_ready: bool
    storage_verified_at: Optional[datetime]
    storage_last_tested_at: Optional[datetime]
    storage_last_test_error: Optional[str]

    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SystemStorageSettingsTestResponse(BaseModel):
    success: bool
    is_ready: bool
    storage_verified_at: Optional[datetime] = None
    storage_last_tested_at: Optional[datetime] = None
    storage_last_test_error: Optional[str] = None
