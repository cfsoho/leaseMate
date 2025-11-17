# app/models/ledger_entry.py

from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime,
    ForeignKey, Enum, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base
from app.db.models.enums.ledger_entry_type import LedgerEntryType
from app.db.models.enums.document_object_type import DocumentObjectType


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 所屬物件
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # 類別（收入 / 支出 / 稅 / 水電等）
    entry_type = Column(
        Enum(LedgerEntryType),
        nullable=False,
        index=True
    )

    # 金額與收入屬性
    amount = Column(Numeric(12, 2), nullable=False)
    is_income = Column(Integer, nullable=False, default=0)   # 0 = expense, 1 = income

    # 多型來源（例如：payment, expense, utility…）
    source_type = Column(
        Enum(DocumentObjectType),    # 你已有這個 enum
        nullable=True,
        index=True
    )
    source_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # 附屬說明
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    property = relationship("Property", back_populates="ledger_entries")
