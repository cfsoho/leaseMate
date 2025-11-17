# app/models/utility_bill.py
from sqlalchemy import (
    Column, String, Date, Numeric, DateTime, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class UtilityBill(Base):
    __tablename__ = "utility_bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    bill_type = Column(String(50), nullable=False)
    # "electricity", "water", "gas", "internet", "common_fee"

    billing_month = Column(String(7), nullable=False)
    # "2025-01", "2025-02"

    amount = Column(Numeric(10, 2), nullable=False)

    due_date = Column(Date, nullable=True)
    paid_date = Column(Date, nullable=True)

    # 記錄儀表數值（選填）
    meter_start = Column(Numeric(10, 2), nullable=True)
    meter_end = Column(Numeric(10, 2), nullable=True)

    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="utility_bills")
