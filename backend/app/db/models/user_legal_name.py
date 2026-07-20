import uuid

from sqlalchemy import (
    Boolean,
    Column,
    String,
    DateTime,
    ForeignKey,
    func,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserLegalName(Base):
    __tablename__ = "user_legal_names"

    # Internal UUID for this legal name record.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # User this official/legal name belongs to.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Country/legal jurisdiction this name belongs to.
    #
    # Examples:
    # USA official name
    # Taiwan official name
    # Japan registered name
    country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        nullable=False,
        index=True
    )

    # Locale/language representation of this official name.
    #
    # Examples:
    # en
    # zh-TW
    # ja
    locale_code = Column(
        String(35),
        ForeignKey("ref.locales.code"),
        nullable=False,
        index=True
    )

    # Full official/legal name as written for that country/locale.
    #
    # Examples:
    # Jonathan Fong
    # Fong Young
    # Fong Young / 方揚
    full_name = Column(
        String(150),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Soft-delete marker. Deleted legal names are hidden from normal profile
    # display, but can be restored when the exact same legal name is added again.
    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )

    # UTC timestamp when this legal name was soft-deleted.
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # User UUID that performed the soft delete.
    deleted_by = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    # Prevent duplicate active official-name entries for the same user,
    # country, locale, and exact legal name.
    #
    # The same country/locale can legitimately have more than one legal name.
    # Example: a user may own some Thailand properties under a US passport name
    # and others under a Taiwan passport name, both written in English.
    __table_args__ = (
        Index(
            "uq_user_legal_name_user_country_locale_full_name_active",
            "user_id",
            "country_id",
            "locale_code",
            "full_name",
            unique=True,
            postgresql_where=is_deleted.is_(False),
        ),
    )

    user = relationship("User")
    country = relationship("Country")
    locale = relationship("Locale")
