# app/db/models/payment.py

from sqlalchemy import (
    Column, DateTime, String, Numeric,
    ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    lease_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    amount_paid = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=False)

    method = Column(String(50), nullable=True)  # transfer / promptpay / cash / etc
    note = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lease = relationship(
        "Lease",
        back_populates="payments",
        passive_deletes=True
    )

    coverage = relationship(
        "PaymentCoverage",
        back_populates="payment",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
