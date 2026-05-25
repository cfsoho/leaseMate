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

class User(Base):
    __tablename__ = "users"

    # Internal user UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Family/surname.
    family_name = Column(String(50), nullable=False)

    # Given/first name.
    given_name = Column(String(50), nullable=False)

    # Login email. Unique account identifier.
    email = Column(String(254), unique=True, nullable=False, index=True)

    # Hashed password only. Never store plain text password.
    password_hash = Column(String(255), nullable=False)

    # Contact phone number.
    phone = Column(String(20), nullable=True)

    # System role.
    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.roles.id"),
        nullable=True,
        index=True
    )

    # Preferred UI/content locale.
    preferred_locale_code = Column(
        String(35),
        ForeignKey("ref.locales.code"),
        nullable=True,
        index=True
    )

    # Account lifecycle status.
    status = Column(
        String(50),
        ForeignKey("ref.user_statuses.code"),
        nullable=False,
        default="PENDING_EMAIL_VERIFICATION",
        index=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    role = relationship("Role", back_populates="users")
    preferred_locale = relationship("Locale")

    properties_owned = relationship("Property", back_populates="owner_user")

    leases_as_tenant = relationship(
        "Lease",
        back_populates="tenant_user",
        foreign_keys="Lease.tenant_id"
    )

    leases_as_agent = relationship(
        "Lease",
        back_populates="agent_user",
        foreign_keys="Lease.agent_id"
    )

    leases_as_owner = relationship(
        "Lease",
        back_populates="landlord_user",
        foreign_keys="Lease.landlord_id"
    )

    property_access = relationship(
        "PropertyAccess",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    verification_tokens = relationship(
        "UserVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    refresh_tokens = relationship(
        "UserRefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
