# app/models/tax_record.py
from sqlalchemy import (
    Column, Date, Numeric, String, DateTime, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.database import Base


class TaxRecord(Base):
    __tablename__ = "tax_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    tax_year = Column(Integer, nullable=False)  # 2024, 2025
    country = Column(String(50), nullable=False)  # Japan / Thailand / Taiwan
    tax_type = Column(String(50), nullable=False)  # rental_income, property_tax, withholding_tax

    declared_amount = Column(Numeric(12, 2), nullable=True)
    paid_amount = Column(Numeric(12, 2), nullable=True)
    paid_date = Column(Date, nullable=True)

    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="tax_records")
