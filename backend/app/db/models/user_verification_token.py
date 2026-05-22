import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Enum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.enums.user_verification_token_type import (
    UserVerificationTokenType,
)


class UserVerificationToken(Base):
    __tablename__ = "user_verification_tokens"

    # Internal token record UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User this token belongs to.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Token purpose:
    # EMAIL_CONFIRMATION / PASSWORD_RESET / EMAIL_CHANGE
    token_type = Column(
        Enum(UserVerificationTokenType),
        nullable=False,
        index=True
    )

    # Random token sent by email.
    #
    # For production, consider storing a hash instead of raw token.
    token = Column(String(255), nullable=False, unique=True, index=True)

    # Token expiration datetime.
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # NULL = unused; not NULL = already consumed.
    used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="verification_tokens")