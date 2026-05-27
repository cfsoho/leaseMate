import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Region(Base):
    __tablename__ = "regions"
    __table_args__ = {"schema": "ref"}

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Region UUID used by country records.",
    )

    code = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
        comment="Stable region code used by the application.",
    )
    name = Column(
        String(100),
        nullable=False,
        comment="Human-readable region name.",
    )
    description = Column(
        String(255),
        nullable=True,
        comment="Optional description of what this region contains.",
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this region can be selected in forms.",
    )
    sort_order = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Display order for region selectors.",
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the region row was created.",
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the region row was last updated.",
    )

    countries = relationship("Country", back_populates="region")
