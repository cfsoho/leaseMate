import uuid

from sqlalchemy import (
    Column,
    DateTime,
    String,
    Numeric,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Payment(Base):
    __tablename__ = "payments"

    # Internal payment UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Related lease.
    #
    # A lease may have many payments.
    lease_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Actual amount received from tenant.
    amount_paid = Column(
        Numeric(10, 2),
        nullable=False
    )

    # Currency of this payment.
    #
    # Examples:
    # THB
    # JPY
    # USD
    currency_code = Column(
        String(3),
        nullable=False,
        default="THB"
    )

    # Actual payment timestamp.
    #
    # Used for:
    # - payment history
    # - tax/accounting
    # - overdue calculations
    paid_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    # Payment method/channel.
    #
    # Examples:
    # bank_transfer
    # promptpay
    # cash
    # paypal
    # wise
    method = Column(
        String(50),
        nullable=True
    )

    # External bank/payment reference number.
    #
    # Useful for:
    # - reconciliation
    # - audits
    # - tracing transactions
    reference_no = Column(
        String(100),
        nullable=True,
        index=True
    )

    # User/staff who recorded or received this payment.
    #
    # Nullable because:
    # - auto-imported payments
    # - migration data
    # - system-generated entries
    received_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    # Freeform notes.
    #
    # Examples:
    # tenant paid late
    # partial payment
    # included utility reimbursement
    note = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships

    lease = relationship(
        "Lease",
        back_populates="payments",
        passive_deletes=True
    )

    receiver = relationship("User")

    # Payment allocation entries.
    #
    # One payment may cover:
    # - multiple months
    # - partial months
    # - multiple billing periods
    coverage_entries = relationship(
        "PaymentCoverage",
        back_populates="payment",
        cascade="all, delete-orphan",
        passive_deletes=True
    )