# app/db/models/ledger_entry.py

import uuid

from sqlalchemy import (
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    Boolean,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    # Internal ledger entry UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Property this ledger entry belongs to.
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # Ledger classification.
    #
    # Examples:
    # RENT_INCOME
    # REPAIR_EXPENSE
    # UTILITY_EXPENSE
    # TAX
    entry_type = Column(
        String(50),
        ForeignKey("ref.ledger_entry_types.code"),
        nullable=False,
        index=True
    )

    # Accounting date of this ledger entry.
    #
    # This may differ from created_at.
    #
    # Example:
    # created_at = when record was entered
    # entry_date = when income/expense actually occurred
    entry_date = Column(
        Date,
        nullable=False,
        index=True
    )

    # Ledger amount.
    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    # Currency of this ledger amount.
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

    # True = income
    # False = expense/outflow
    is_income = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )

    # Optional polymorphic source type.
    #
    # Used to trace this ledger entry back to
    # the original business object.
    #
    # Examples:
    # PAYMENT
    # EXPENSE
    # UTILITY_BILL
    source_type = Column(
        String(50),
        ForeignKey("ref.document_object_types.code"),
        nullable=True,
        index=True
    )

    # UUID of the source object row.
    source_id = Column(
        UUID(as_uuid=True),
        nullable=True,
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
        back_populates="ledger_entries"
    )
