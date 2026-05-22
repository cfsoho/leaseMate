# contractor.py
from sqlalchemy import (
    Column, String, DateTime, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(100), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)

    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(100), nullable=True, index=True)

    contractor_type = Column(String(50), nullable=True)  # (可選，但很實用)

    address = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    expenses = relationship("Expense", back_populates="contractor")
