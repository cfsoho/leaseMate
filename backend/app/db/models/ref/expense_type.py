import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class ExpenseType(Base):
    __tablename__ = "expense_types"
    __table_args__ = (
        UniqueConstraint(
            "code",
            "locale",
            name="uq_expense_type_code_locale"
        ),
        {"schema": "ref"},
    )

    # Shared multilingual UUID identifier.
    #
    # Same id across all locales:
    #
    # id=AAA + locale=en     -> Repair
    # id=AAA + locale=zh-TW  -> 修繕
    # id=AAA + locale=th     -> ซ่อมแซม
    #
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Shared multilingual expense type UUID."
    )

    # Locale code for this translation row.
    #
    # Examples:
    # en
    # zh-TW
    # th
    # ja
    locale = Column(
        String(35),
        primary_key=True,
        comment="Locale code for this expense type translation."
    )

    # Stable internal/business code.
    #
    # Used for:
    # - reporting
    # - tax export
    # - filtering
    # - AI workflows
    # - backend business logic
    #
    # Examples:
    # REPAIR
    # MAINTENANCE
    # TAX
    # INSURANCE
    # CLEANING
    code = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Stable expense type code used by backend logic and reporting."
    )

    # Localized display name.
    #
    # Examples:
    # Repair
    # 修繕
    # ซ่อมแซม
    name = Column(
        String(100),
        nullable=False,
        comment="Localized expense type display name."
    )

    # Optional localized description/help text.
    description = Column(
        String(255),
        nullable=True,
        comment="Optional localized help text for this expense type."
    )

    # Soft active/inactive flag.
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this expense type can be selected in forms."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the expense type row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the expense type row was last updated."
    )

    # Prevent duplicate code within same locale.
    #
    # Example:
    # REPAIR + en -> unique
    # REPAIR + zh-TW -> unique
