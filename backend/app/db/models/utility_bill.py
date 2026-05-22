import uuid

from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    Numeric,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UtilityBill(Base):
    __tablename__ = "utility_bills"

    # Internal utility bill UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Property this utility bill belongs to.
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # Shared multilingual utility type id.
    #
    # Display language is resolved by frontend/user locale.
    #
    # Example:
    # utility_type_id -> Electricity / 電費 / ค่าไฟฟ้า
    utility_type_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Billing year.
    #
    # Example:
    # 2026
    billing_year = Column(
        Integer,
        nullable=False,
        index=True
    )

    # Billing month.
    #
    # Values:
    # 1 ~ 12
    billing_month = Column(
        Integer,
        nullable=False,
        index=True
    )

    # Amount billed.
    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    # Currency of billed amount.
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

    # Payment due date.
    due_date = Column(
        Date,
        nullable=True
    )

    # Actual paid date.
    paid_date = Column(
        Date,
        nullable=True
    )

    # Meter reading at the start of billing period.
    #
    # Optional because not every utility has a meter.
    meter_start = Column(
        Numeric(10, 2),
        nullable=True
    )

    # Meter reading at the end of billing period.
    meter_end = Column(
        Numeric(10, 2),
        nullable=True
    )

    # Utility bill lifecycle status.
    #
    # Examples:
    # pending
    # paid
    # overdue
    # cancelled
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        index=True
    )

    # Freeform notes.
    notes = Column(
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

    property = relationship(
        "Property",
        back_populates="utility_bills"
    )