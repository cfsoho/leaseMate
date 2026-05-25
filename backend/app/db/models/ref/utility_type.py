import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class UtilityType(Base):
    __tablename__ = "utility_types"
    __table_args__ = (
        UniqueConstraint(
            "code",
            "locale",
            name="uq_utility_type_code_locale"
        ),
        {"schema": "ref"},
    )

    # Shared multilingual UUID identifier.
    #
    # Same id across all locales:
    #
    # id=AAA + locale=en     -> Electricity
    # id=AAA + locale=zh-TW  -> 電費
    # id=AAA + locale=th     -> ค่าไฟฟ้า
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Locale code for this translation row.
    #
    # Examples:
    # en
    # zh-TW
    # th
    locale = Column(
        String(35),
        primary_key=True
    )

    # Stable internal/business code.
    #
    # Used for:
    # - reporting
    # - filtering
    # - AI extraction
    # - tax/accounting grouping
    #
    # Examples:
    # ELECTRICITY
    # WATER
    # GAS
    # INTERNET
    # COMMON_FEE
    code = Column(
        String(50),
        nullable=False,
        index=True
    )

    # Localized display name.
    name = Column(
        String(100),
        nullable=False
    )

    # Optional localized description/help text.
    description = Column(
        String(255),
        nullable=True
    )

    # Whether this utility type is active/selectable.
    is_active = Column(
        Boolean,
        nullable=False,
        default=True
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

    # Prevent duplicate code within same locale.
