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
        primary_key=True,
        comment="BCP-47 locale code used for UI language and translations."
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
        nullable=False,
        comment="English or system display name for this locale."
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
        nullable=True,
        comment="Locale name written in its own language."
    )

    # Name display/input order for personal names in this locale.
    #
    # Values:
    # - GIVEN_FAMILY = given name first, then family name
    # - FAMILY_GIVEN = family name first, then given name
    name_order = Column(
        String(20),
        nullable=False,
        default="GIVEN_FAMILY",
        comment="Default personal-name order for this locale."
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
        default="{given_name} {family_name}",
        comment="Name display mask using {given_name} and {family_name} placeholders."
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
        default=True,
        comment="Whether this locale can be selected in forms."
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
        default=0,
        comment="Display order for locale selectors."
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
        default=False,
        comment="Whether this locale is the fallback/default locale."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the locale row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the locale row was last updated."
    )

    # Relationships

    countries = relationship(
        "Country",
        back_populates="default_locale"
    )
