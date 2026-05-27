import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class DocumentType(Base):
    __tablename__ = "document_types"
    __table_args__ = (
        UniqueConstraint(
            "code",
            "locale",
            name="uq_document_type_code_locale"
        ),
        {"schema": "ref"},
    )

    # Shared multilingual UUID identifier.
    #
    # Same id across all locales:
    #
    # id=AAA + locale=en     -> Lease Contract
    # id=AAA + locale=zh-TW  -> 租賃契約
    # id=AAA + locale=th     -> สัญญาเช่า
    #
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Shared multilingual document type UUID."
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
        comment="Locale code for this document type translation."
    )

    # Stable internal/business code.
    #
    # Used for:
    # - backend logic
    # - integration
    # - reporting
    # - conditional behavior
    #
    # Examples:
    # LEASE_CONTRACT
    # RECEIPT
    # TAX_DOCUMENT
    code = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Stable document type code used by backend logic and reporting."
    )

    # Localized display name.
    #
    # Examples:
    # Lease Contract
    # 租賃契約
    # สัญญาเช่า
    name = Column(
        String(100),
        nullable=False,
        comment="Localized document type display name."
    )

    # Optional localized description/help text.
    description = Column(
        Text,
        nullable=True,
        comment="Optional localized help text for this document type."
    )

    # Soft active/inactive flag.
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this document type can be selected in forms."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the document type row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the document type row was last updated."
    )

    # Prevent duplicate code within same locale.
    #
    # Example:
    # LEASE_CONTRACT + en -> unique
    # LEASE_CONTRACT + zh-TW -> unique
