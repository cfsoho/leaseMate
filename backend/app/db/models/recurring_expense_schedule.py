import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class RecurringExpenseSchedule(Base):
    __tablename__ = "recurring_expense_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    expense_type_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    contractor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("contractors.id"),
        nullable=True,
        index=True
    )

    amount = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), nullable=False, default="THB")

    frequency = Column(String(20), nullable=False, default="monthly")
    interval_count = Column(Integer, nullable=False, default=1)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_due_date = Column(Date, nullable=False, index=True)

    auto_create_expense = Column(Boolean, nullable=False, default=False)
    description = Column(String(255), nullable=True)
    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="Current recurring expense schedule status."
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    property = relationship("Property", back_populates="recurring_expense_schedules")
    contractor = relationship("Contractor")
