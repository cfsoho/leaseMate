from sqlalchemy import (
    Column, String, Integer, ForeignKey,
    Numeric, DateTime, func, Index
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base
import uuid

class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    users = relationship("User", back_populates="role")
