# app/db/models/payment_coverage.py

from sqlalchemy import (
    Column, Integer, Numeric, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class PaymentCoverage(Base):
    __tablename__ = "payment_coverage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    payment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    lease_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    period_year = Column(Integer, nullable=False)
    period_month = Column(Integer, nullable=False)   # 1~12

    amount_applied = Column(Numeric(10, 2), nullable=False)

    # Relationships
    payment = relationship(
        "Payment",
        back_populates="coverage",
        passive_deletes=True
    )

    lease = relationship(
        "Lease",
        back_populates="coverage_entries",
        passive_deletes=True
    )
