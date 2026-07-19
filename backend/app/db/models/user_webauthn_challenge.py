import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserWebAuthnChallenge(Base):
    __tablename__ = "user_webauthn_challenges"

    # Internal challenge UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User for registration challenges. Authentication challenges may be userless.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # WebAuthn challenge from generated options, stored as base64url text.
    challenge = Column(String(1024), nullable=False, index=True)

    # PASSKEY_REGISTRATION or PASSKEY_AUTHENTICATION.
    challenge_type = Column(String(50), nullable=False, index=True)

    # Challenge expiration datetime.
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # NULL = unused; not NULL = already consumed.
    used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="webauthn_challenges")
