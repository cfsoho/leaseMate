import uuid

from sqlalchemy import (
    Column,
    String,
    Date,
    Numeric,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    # Internal expense UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Related property.
    #
    # Indicates which property this expense belongs to.
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # Shared multilingual expense type id.
    #
    # IMPORTANT:
    # Only stores shared type identity.
    # Localized display name is resolved
    # later by frontend/viewer locale.
    #
    # Example:
    # REPAIR
    # -> Repair
    # -> 修繕
    # -> ซ่อมแซม
    expense_type_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    # Related contractor/vendor.
    #
    # Examples:
    # plumber
    # electrician
    # painter
    contractor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("contractors.id"),
        nullable=True,
        index=True
    )

    # Initial estimated/quoted amount.
    quoted_amount = Column(
        Numeric(10, 2),
        nullable=True
    )

    # Actual finalized amount paid.
    actual_amount = Column(
        Numeric(10, 2),
        nullable=True
    )

    # Expense/service start date.
    #
    # Useful for:
    # - renovation periods
    # - maintenance windows
    # - recurring services
    start_date = Column(
        Date,
        nullable=True
    )

    # Expense/service completion/end date.
    end_date = Column(
        Date,
        nullable=True
    )

    # Freeform notes/description.
    #
    # Examples:
    # bathroom leak repair
    # annual aircon cleaning
    description = Column(
        String(255),
        nullable=True
    )

    # Expense workflow/business status.
    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="Current workflow status for this expense."
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

    contractor = relationship(
        "Contractor",
        back_populates="expenses"
    )

    property = relationship(
        "Property",
        back_populates="expenses"
    )
