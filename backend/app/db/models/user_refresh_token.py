import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserRefreshToken(Base):
    __tablename__ = "user_refresh_tokens"

    # Internal refresh-token session UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User this login session belongs to.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Hash of refresh token, not raw token.
    token_hash = Column(String(255), nullable=False, unique=True, index=True)

    # Refresh token expiration datetime.
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # NULL = active; not NULL = logged out/revoked.
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # Browser/device info, usually from User-Agent.
    #
    # Example:
    # Chrome on macOS
    # Safari on iPhone
    device_info = Column(String(255), nullable=True)

    # Client IP address.
    #
    # Supports IPv4 and IPv6.
    ip_address = Column(String(45), nullable=True)

    # Optional coarse login location captured from trusted reverse-proxy headers.
    #
    # These fields are not resolved by calling a third-party IP lookup service.
    # In production, pass values from infrastructure such as Cloudflare,
    # a load balancer, or a private geolocation middleware.
    location_country_code = Column(String(2), nullable=True)
    location_region = Column(String(100), nullable=True)
    location_city = Column(String(100), nullable=True)

    # Last time this refresh token/session was used.
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")
