from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey,
    func, Enum, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base
from app.db.models.document_type import DocumentType
from app.db.models.enums.document_status import DocumentStatus
from app.db.models.enums.document_visibility import DocumentVisibility
from app.db.models.enums.storage_type import StorageType


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    document_type_id = Column(
        Integer,
        ForeignKey("document_types.id"),
        nullable=False,
        index=True
    )
    document_type = relationship("DocumentType")

    file_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)

    storage_type = Column(
        Enum(StorageType),
        nullable=False,
        default=StorageType.NAS
    )

    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)

    version = Column(Integer, nullable=False, default=1)
    status = Column(
        Enum(DocumentStatus),
        nullable=False,
        default=DocumentStatus.DRAFT
    )

    visibility = Column(
        Enum(DocumentVisibility),
        nullable=False,
        default=DocumentVisibility.OWNER_ONLY
    )

    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    uploader = relationship("User")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True))

    links = relationship(
        "DocumentLink",
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
