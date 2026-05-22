import uuid

from sqlalchemy import (
    Column, DateTime, ForeignKey, func,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class PropertyAccess(Base):
    __tablename__ = "property_access"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Property being shared
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # User who receives access
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Shared multilingual access level id.
    # Display label is resolved by frontend/user locale.
    access_level_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Only one access record per user per property
    __table_args__ = (
        UniqueConstraint("property_id", "user_id", name="uq_property_user_access"),
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship("User", back_populates="property_access")
    property = relationship("Property", back_populates="access_list")