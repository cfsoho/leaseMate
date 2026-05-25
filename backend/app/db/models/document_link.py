import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    func,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

class DocumentLink(Base):
    __tablename__ = "document_links"

    # Internal UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Linked document id.
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    document = relationship(
        "Document",
        back_populates="links"
    )

    # Target object/entity type.
    #
    # Examples:
    # LEASE
    # PROPERTY
    # PAYMENT
    # EXPENSE
    object_type = Column(
        String(50),
        ForeignKey("ref.document_object_types.code"),
        nullable=False,
        index=True
    )

    # UUID of the linked object row.
    object_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
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

    # Prevent duplicate same document/object link.
    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "object_type",
            "object_id",
            name="uq_document_link_document_object"
        ),

        # Fast lookup:
        # "find all documents linked to this object"
        Index(
            "idx_documentlink_object",
            "object_type",
            "object_id"
        ),
    )
