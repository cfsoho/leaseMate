from sqlalchemy import (
    Column, DateTime, ForeignKey, Enum, func, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base
from app.db.models.enums.document_object_type import DocumentObjectType


class DocumentLink(Base):
    __tablename__ = "document_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id"),
        nullable=False,
        index=True
    )
    document = relationship("Document", back_populates="links")

    object_type = Column(
        Enum(DocumentObjectType),
        nullable=False,
        index=True
    )

    object_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("document_id", "object_type", "object_id"),
        Index("idx_documentlink_object", "object_type", "object_id")
    )
