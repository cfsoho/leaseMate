import uuid

from sqlalchemy import Boolean, Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.mutable import MutableDict

from app.db.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    # Generic system setting row. EMAIL and STORAGE settings use the same table
    # so new system setup areas do not need a new table every time.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Stable setting area key, for example EMAIL or STORAGE.
    setting_key = Column(String(80), nullable=False, unique=True)

    # Non-secret configuration values stored by centralized enum keys.
    config = Column(MutableDict.as_mutable(JSONB), nullable=False, default=dict)

    # Secret configuration values stored by centralized enum keys.
    #
    # The API must never return this object.
    secret_config = Column(MutableDict.as_mutable(JSONB), nullable=False, default=dict)

    # Whether the current config has been verified by its own flow.
    is_verified = Column(Boolean, nullable=False, default=False)

    # UTC time when the current config was verified.
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # One-time verification token for the current config.
    verification_token = Column(String(255), nullable=True, unique=True, index=True)

    # UTC time when the current verification token was issued.
    verification_sent_at = Column(DateTime(timezone=True), nullable=True)

    # UTC expiry time for the current verification token.
    verification_expires_at = Column(DateTime(timezone=True), nullable=True)

    # UTC time when this setting was last tested.
    last_tested_at = Column(DateTime(timezone=True), nullable=True)

    # Last test failure message, cleared after success.
    last_test_error = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True, index=True)
