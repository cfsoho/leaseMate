import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.ref.status_code import STATUS_CODE_IDS


class LeaseRentPeriod(Base):
    __tablename__ = "lease_rent_periods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    lease_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)

    rent_amount = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), nullable=False, default="THB")

    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        default=STATUS_CODE_IDS["RENT_PERIOD_PENDING"],
        index=True,
        comment="Current expected-rent period status."
    )
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    lease = relationship("Lease", back_populates="rent_periods")

    __table_args__ = (
        UniqueConstraint(
            "lease_id",
            "period_start",
            "period_end",
            name="uq_lease_rent_period_lease_period"
        ),
    )
