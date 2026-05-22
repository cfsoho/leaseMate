import uuid

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    func,
    Enum,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.enums.document_status import DocumentStatus
from app.db.models.enums.document_visibility import DocumentVisibility
from app.db.models.enums.storage_type import StorageType


class Document(Base):
    __tablename__ = "documents"

    # Internal document UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Shared multilingual document type id.
    #
    # IMPORTANT:
    # This stores only the shared type concept id.
    # Actual localized display name is resolved
    # using viewer/frontend locale.
    #
    # Example:
    # contract -> "Lease Contract"
    #          -> "租賃契約"
    #          -> "สัญญาเช่า"
    document_type_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Original uploaded filename.
    #
    # Example:
    # lease_2026.pdf
    file_name = Column(
        String(255),
        nullable=False
    )

    # Internal stored filename.
    #
    # Usually randomized/generated.
    #
    # Example:
    # 8f7c8f2f-xxxx.pdf
    stored_name = Column(
        String(255),
        nullable=False
    )

    # Physical storage path.
    #
    # Can later support:
    # - NAS
    # - S3
    # - cloud storage
    file_path = Column(
        String(500),
        nullable=False
    )

    # Physical storage backend type.
    storage_type = Column(
        Enum(StorageType),
        nullable=False,
        default=StorageType.NAS
    )

    # MIME content type.
    #
    # Examples:
    # application/pdf
    # image/png
    mime_type = Column(
        String(100),
        nullable=False
    )

    # File size in bytes.
    size = Column(
        Integer,
        nullable=False
    )

    # Document version number.
    #
    # Useful for:
    # - draft revisions
    # - signed/final versions
    # - historical tracking
    version = Column(
        Integer,
        nullable=False,
        default=1
    )

    # Business document lifecycle status.
    #
    # Examples:
    # DRAFT
    # FINAL
    # SIGNED
    status = Column(
        Enum(DocumentStatus),
        nullable=False,
        default=DocumentStatus.DRAFT
    )

    # Visibility/access scope.
    visibility = Column(
        Enum(DocumentVisibility),
        nullable=False,
        default=DocumentVisibility.OWNER_ONLY
    )

    # User who uploaded the document.
    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    uploader = relationship("User")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Soft delete flag.
    #
    # Physical file may remain for:
    # - audit
    # - recovery
    # - tax/legal retention
    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # Polymorphic links to:
    # - lease
    # - property
    # - payment
    # - expense
    # etc.
    links = relationship(
        "DocumentLink",
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True
    )