from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    DateTime,
    func,
)

from sqlalchemy.orm import relationship

from app.db.database import Base


class Locale(Base):
    __tablename__ = "locales"

    # Store under reference/master schema
    # because this is normalized system reference data.
    __table_args__ = {"schema": "ref"}

    # Locale/language code.
    #
    # Examples:
    # en
    # zh-TW
    # th
    # ja
    #
    # Used for:
    # - frontend i18n
    # - translation mapping
    # - default user language
    # - document language selection
    # - AI translation workflows
    code = Column(
        String(35),
        primary_key=True
    )

    # English/system display name.
    #
    # Examples:
    # English
    # Traditional Chinese
    # Thai
    # Japanese
    name = Column(
        String(255),
        nullable=False
    )

    # Native/local language display name.
    #
    # Examples:
    # English
    # 繁體中文
    # ไทย
    # 日本語
    #
    # Useful for:
    # - language dropdowns
    # - multilingual UI selectors
    # - Wikipedia-style native language display
    native_name = Column(
        String(255),
        nullable=True
    )

    # Name display/input order for personal names in this locale.
    #
    # Values:
    # - GIVEN_FAMILY = given name first, then family name
    # - FAMILY_GIVEN = family name first, then given name
    name_order = Column(
        String(20),
        nullable=False,
        default="GIVEN_FAMILY"
    )

    # Name display mask using placeholders.
    #
    # Supported placeholders:
    # - {given_name}
    # - {family_name}
    #
    # Literal spaces and punctuation are preserved.
    name_format_mask = Column(
        String(100),
        nullable=False,
        default="{given_name} {family_name}"
    )

    # Whether this locale is active/selectable.
    #
    # Can be disabled temporarily if:
    # - translation incomplete
    # - frontend not ready
    # - maintenance mode
    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    # UI display ordering.
    #
    # Examples:
    # 1 = English
    # 2 = 繁體中文
    # 3 = ไทย
    sort_order = Column(
        Integer,
        nullable=False,
        default=0
    )

    # Indicates system fallback/default locale.
    #
    # Usually:
    # en = True
    #
    # Used when:
    # - translation missing
    # - user locale unavailable
    # - AI translation fallback required
    is_default = Column(
        Boolean,
        nullable=False,
        default=False
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

    # Relationships

    countries = relationship(
        "Country",
        back_populates="default_locale"
    )
