# app/models/expense.py
from sqlalchemy import (
    Column, String, Date, Numeric, DateTime, ForeignKey, func, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    category_id = Column(
        ForeignKey("expense_categories.id"),
        nullable=True,
        index=True
    )

    contractor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("contractors.id"),
        nullable=True,
        index=True
    )

    quoted_amount = Column(Numeric(10, 2), nullable=True)
    actual_amount = Column(Numeric(10, 2), nullable=True)

    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    description = Column(String(255), nullable=True)

    # 狀態：pending / in_progress / completed / paid
    status = Column(String(20), nullable=False, default="pending")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationship
    category = relationship("ExpenseCategory")
    contractor = relationship("Contractor", back_populates="expenses")
    property = relationship("Property", back_populates="expenses")
