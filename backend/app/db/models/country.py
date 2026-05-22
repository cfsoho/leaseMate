# app/db/models/country.py

import uuid

from sqlalchemy import (
    Column,
    String,
    ForeignKey,
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Country(Base):
    __tablename__ = "countries"

    # Store under reference/master schema
    # because this is a normalized lookup table
    __table_args__ = {"schema": "ref"}

    # Internal UUID primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # ISO 3166-1 alpha-3 country code
    #
    # Commonly used in:
    # - enterprise systems
    # - ERP/accounting integrations
    # - international standards
    # - reporting/export files
    #
    # Examples:
    # THA = Thailand
    # JPN = Japan
    # USA = United States
    # TWN = Taiwan
    code = Column(
        String(3),
        unique=True,
        index=True,
        nullable=False,
        comment="ISO 3166-1 alpha-3 country code"
    )

    # ISO 3166-1 alpha-2 country code
    #
    # Commonly used in:
    # - browser locales (en-US, ja-JP)
    # - frontend country selectors
    # - flag icon libraries
    # - URLs/domains
    #
    # Examples:
    # TH = Thailand
    # JP = Japan
    # US = United States
    # TW = Taiwan
    alpha2 = Column(
        String(2),
        unique=True,
        nullable=False,
        comment="ISO 3166-1 alpha-2 country code"
    )

    # Official display name of the country
    #
    # NOTE:
    # This field is currently single-language.
    # Future multilingual support may follow
    # the shared (id, locale) LeaseMate pattern.
    #
    # Examples:
    # Thailand
    # Japan
    # Taiwan
    name = Column(
        String(100),
        nullable=False,
        comment="Official country display name"
    )


    # Country name written in its own native/local language.
    #
    # Useful for:
    # - multilingual country selectors
    # - displaying native country names in UI
    # - Wikipedia-style language display
    # - tenant-facing forms/documents
    #
    # Examples:
    # Thailand      -> ประเทศไทย
    # Japan         -> 日本
    # Taiwan        -> 台灣
    # Germany       -> Deutschland
    #
    # NOTE:
    # This is intended as a convenience/display field,
    # not a full multilingual translation system.
    native_name = Column(
        String(100),
        nullable=True,
        comment="Country name in its native/local language"
    )

    # International phone dialing prefix
    #
    # Examples:
    # +66 = Thailand
    # +81 = Japan
    # +886 = Taiwan
    phone_prefix = Column(
        String(6),
        nullable=True,
        comment="International dialing prefix"
    )

    # Geographical region / continent grouping
    #
    # Examples:
    # Asia
    # Europe
    # North America
    region = Column(
        String(50),
        nullable=True,
        comment="Geographical region or continent"
    )

    # ISO 4217 currency code
    #
    # Examples:
    # THB = Thai Baht
    # JPY = Japanese Yen
    # USD = US Dollar
    # TWD = New Taiwan Dollar
    currency_code = Column(
        String(3),
        nullable=False,
        comment="ISO 4217 currency code"
    )

    # Default UI/content locale typically associated
    # with this country.
    #
    # Used for:
    # - default UI language selection
    # - lease template language defaults
    # - OCR/AI language hints
    # - tenant communication defaults
    #
    # Examples:
    # th
    # ja
    # en
    # zh-TW
    default_locale_code = Column(
        String(10),
        ForeignKey("ref.locales.code"),
        nullable=True,
        index=True,
        comment="Default locale code for this country"
    )

    # Relationships

    default_locale = relationship("Locale")

    properties = relationship(
        "Property",
        back_populates="country"
    )