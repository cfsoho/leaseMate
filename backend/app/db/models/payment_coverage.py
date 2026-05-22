import uuid

from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class PaymentCoverage(Base):
    __tablename__ = "payment_coverage"

    # Internal allocation UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Related payment.
    payment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Related lease.
    #
    # Stored redundantly for:
    # - easier querying
    # - reporting
    # - integrity validation
    lease_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Covered billing year.
    #
    # Example:
    # 2026
    period_year = Column(
        Integer,
        nullable=False
    )

    # Covered billing month.
    #
    # Values:
    # 1 ~ 12
    period_month = Column(
        Integer,
        nullable=False
    )

    # Amount applied toward this billing period.
    #
    # Useful for:
    # - partial payments
    # - prorated rent
    # - multi-month payments
    amount_applied = Column(
        Numeric(10, 2),
        nullable=False
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

    payment = relationship(
        "Payment",
        back_populates="coverage_entries",
        passive_deletes=True
    )

    lease = relationship(
        "Lease",
        back_populates="coverage_entries",
        passive_deletes=True
    )

    # Prevent duplicate allocation
    # for same payment + lease + period.
    __table_args__ = (
        UniqueConstraint(
            "payment_id",
            "lease_id",
            "period_year",
            "period_month",
            name="uq_payment_coverage_payment_lease_period"
        ),
    )