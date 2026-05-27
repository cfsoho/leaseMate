import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class LeaseDeposit(Base):
    __tablename__ = "lease_deposits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    lease_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    deposit_type = Column(String(50), nullable=False, default="security")

    amount_due = Column(Numeric(10, 2), nullable=False)
    amount_received = Column(Numeric(10, 2), nullable=True)
    currency_code = Column(String(3), nullable=False, default="THB")

    due_date = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)

    deduction_amount = Column(Numeric(10, 2), nullable=True)
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refund_date = Column(Date, nullable=True)

    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="Current deposit lifecycle status."
    )
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    lease = relationship("Lease", back_populates="deposits")
