import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Integer,
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

    # Timestamp when the user confirmed ownership of the login email.
    email_verified_at = Column(DateTime(timezone=True), nullable=True)

    # Hashed password only. Never store plain text password.
    password_hash = Column(String(255), nullable=False)

    # Temporary-password accounts must set their own password after first login.
    password_must_change = Column(Boolean, nullable=False, default=False)

    # Incremented when existing access tokens must stop working.
    #
    # Example:
    # A successful password reset must invalidate any already-open logged-in
    # browser tabs for the same user.
    token_version = Column(Integer, nullable=False, default=0)

    # Contact phone number.
    phone = Column(String(20), nullable=True)

    # Country whose dialing prefix and phone mask apply to this phone number.
    phone_country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        nullable=True,
        index=True
    )

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

    # Preferred UI color mode: light, dark, or auto by local time.
    theme_preference = Column(String(20), nullable=False, default="light")

    # Account lifecycle status.
    status = Column(
        String(50),
        ForeignKey("ref.user_statuses.code"),
        nullable=False,
        default="NEEDS_EMAIL_VERIFICATION",
        index=True
    )

    # Admin/operator user who created this individual record.
    # Null means the record was created by bootstrap, seed, or older data.
    created_by_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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
    phone_country = relationship("Country")

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

    delegations_given = relationship(
        "UserDelegation",
        foreign_keys="UserDelegation.delegate_user_id",
        back_populates="delegate_user",
        cascade="all, delete-orphan"
    )

    delegations_received = relationship(
        "UserDelegation",
        foreign_keys="UserDelegation.subject_user_id",
        back_populates="subject_user",
        cascade="all, delete-orphan"
    )

    verification_tokens = relationship(
        "UserVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    @property
    def role_code(self):
        return self.role.code if self.role else None

    refresh_tokens = relationship(
        "UserRefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    passkeys = relationship(
        "UserPasskey",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    webauthn_challenges = relationship(
        "UserWebAuthnChallenge",
        back_populates="user",
        cascade="all, delete-orphan"
    )
