import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserPasskey(Base):
    __tablename__ = "user_passkeys"

    # Internal passkey UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User this passkey belongs to.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # WebAuthn credential id, stored as base64url text.
    credential_id = Column(String(1024), nullable=False, unique=True, index=True)

    # WebAuthn credential public key, stored as base64url text.
    credential_public_key = Column(Text, nullable=False)

    # Authenticator signature counter used to detect cloned credentials.
    sign_count = Column(Integer, nullable=False, default=0)

    # User-friendly label shown in account security UI.
    name = Column(String(100), nullable=True)

    # Authenticator type reported by WebAuthn verification.
    device_type = Column(String(50), nullable=True)

    # Whether the authenticator reports the passkey is backed up/synced.
    backed_up = Column(Boolean, nullable=False, default=False)

    # Comma-separated transport hints, such as internal, hybrid, usb, or nfc.
    transports = Column(String(255), nullable=True)

    # Whether this passkey can be used to sign in.
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    # Last successful sign-in time using this passkey.
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="passkeys")
