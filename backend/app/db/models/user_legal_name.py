import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    func,
    UniqueConstraint,
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

    # Prevent duplicate official name entry for the same user,
    # country, and locale.
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "country_id",
            "locale_code",
            name="uq_user_legal_name_user_country_locale"
        ),
    )

    user = relationship("User")
    country = relationship("Country")
    locale = relationship("Locale")