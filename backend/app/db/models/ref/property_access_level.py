import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class PropertyAccessLevel(Base):
    __tablename__ = "property_access_levels"
    __table_args__ = (
        UniqueConstraint(
            "code",
            "locale",
            name="uq_property_access_level_code_locale"
        ),
        {"schema": "ref"},
    )

    # Shared multilingual UUID identifier.
    #
    # Same id across locales:
    # id=AAA + locale=en     -> Owner
    # id=AAA + locale=zh-TW  -> 所有人
    # id=AAA + locale=th     -> เจ้าของ
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Shared multilingual property access level UUID."
    )

    # Locale code.
    #
    # Examples:
    # en
    # zh-TW
    # th
    locale = Column(
        String(35),
        primary_key=True,
        comment="Locale code for this property access level translation."
    )

    # System-controlled access level code.
    #
    # This is an enum because access levels are:
    # - finite
    # - security-related
    # - controlled by the application
    # - not freely user-defined
    code = Column(
        String(50),
        ForeignKey("ref.property_access_level_codes.code"),
        nullable=False,
        index=True,
        comment="Stable access level code used by authorization and sharing logic."
    )

    # Localized display name.
    #
    # Examples:
    # Owner
    # 所有人
    # เจ้าของ
    name = Column(
        String(50),
        nullable=False,
        comment="Localized property access level display name."
    )

    # Optional localized description/help text.
    description = Column(
        String(255),
        nullable=True,
        comment="Optional localized help text for this access level."
    )

    allow_multiple = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether more than one person can have this access level on the same property."
    )

    record_readonly = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this access level can read property records."
    )

    record_writable = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this access level can create or update property records."
    )

    record_deletable = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this access level can delete property records."
    )

    sort_order = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Display order for property access levels when assigning people to a property."
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this access level can be selected in forms."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the access level row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the access level row was last updated."
    )
