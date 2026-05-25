import uuid

from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.ref.status_code import STATUS_CODE_IDS


class Lease(Base):
    __tablename__ = "leases"

    # Internal lease UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Property being leased.
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # Landlord / owner user.
    landlord_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Tenant user.
    #
    # Nullable because lease drafts may be created
    # before tenant information is finalized.
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    # Agent / broker user.
    #
    # Nullable because not every lease has an agent.
    agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    # Lease contract start date.
    start_date = Column(
        Date,
        nullable=False
    )

    # Lease contract end date.
    end_date = Column(
        Date,
        nullable=False
    )

    # Rent amount per payment cycle.
    rent_amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    # Rent currency.
    #
    # Examples:
    # THB
    # JPY
    # TWD
    # USD
    rent_currency = Column(
        String(3),
        nullable=False,
        default="THB"
    )

    # Security deposit amount.
    deposit_amount = Column(
        Numeric(10, 2),
        nullable=True
    )

    # Security deposit currency.
    deposit_currency = Column(
        String(3),
        nullable=True
    )

    # Day of month rent is due.
    #
    # Example:
    # 1 = rent due on the 1st day of each payment period/month.
    due_day = Column(
        Integer,
        nullable=False,
        default=1
    )

    # Number of months per rent payment cycle.
    #
    # Examples:
    # 1  = monthly
    # 3  = quarterly
    # 6  = every 6 months
    # 12 = yearly
    payment_cycle = Column(
        Integer,
        nullable=False,
        default=1
    )

    # Lease lifecycle status.
    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        default=STATUS_CODE_IDS["LEASE_DRAFT"],
        index=True,
        comment="Current lifecycle status for this lease."
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

    rent_periods = relationship(
        "LeaseRentPeriod",
        back_populates="lease",
        cascade="all, delete-orphan"
    )

    deposits = relationship(
        "LeaseDeposit",
        back_populates="lease",
        cascade="all, delete-orphan"
    )
