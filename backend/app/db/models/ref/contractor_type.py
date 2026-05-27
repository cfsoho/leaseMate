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


class ContractorType(Base):
    __tablename__ = "contractor_types"
    __table_args__ = (
        UniqueConstraint("code", "locale", name="uq_contractor_type_code_locale"),
        {"schema": "ref"},
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Shared multilingual contractor type UUID."
    )

    locale = Column(
        String(35),
        primary_key=True,
        comment="Locale code for this contractor type translation."
    )

    code = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Stable contractor type code used by backend logic and reporting."
    )
    name = Column(
        String(100),
        nullable=False,
        comment="Localized contractor type display name."
    )
    description = Column(
        String(255),
        nullable=True,
        comment="Optional localized help text for this contractor type."
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this contractor type can be selected in forms."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the contractor type row was created."
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the contractor type row was last updated."
    )
