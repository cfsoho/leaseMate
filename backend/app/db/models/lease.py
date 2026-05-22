from sqlalchemy import (
    Column, String, Date, DateTime, ForeignKey,
    Integer, Numeric, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class Lease(Base):
    __tablename__ = "leases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    landlord_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    rent_amount = Column(Numeric(10, 2), nullable=False)
    rent_currency = Column(String(3), nullable=False, default="THB")

    deposit_amount = Column(Numeric(10, 2), nullable=True)
    deposit_currency = Column(String(3), nullable=True)

    due_day = Column(Integer, nullable=False, default=1)
    payment_cycle = Column(Integer, nullable=False, default=1)

    status = Column(Integer, nullable=False, default=1, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships

    property = relationship(
        "Property",
        back_populates="leases"
    )

    landlord_user = relationship(
        "User",
        foreign_keys=[landlord_id],
        back_populates="leases_as_owner"
    )

    tenant_user = relationship(
        "User",
        foreign_keys=[tenant_id],
        back_populates="leases_as_tenant"
    )

    agent_user = relationship(
        "User",
        foreign_keys=[agent_id],
        back_populates="leases_as_agent"
    )

    payments = relationship(
        "Payment",
        back_populates="lease",
        cascade="all, delete-orphan"
    )

    coverage_entries = relationship(
        "PaymentCoverage",
        back_populates="lease",
        cascade="all, delete-orphan"
    )