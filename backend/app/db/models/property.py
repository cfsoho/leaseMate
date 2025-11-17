# app/db/models/property.py

from sqlalchemy import (
    Column, String, Integer, ForeignKey,
    Numeric, Date, DateTime, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(100), nullable=False)
    building_name = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    zipcode = Column(String(20), nullable=True)

    country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        index=True
    )

    # 產權人（房產證上的 owner）
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # 購買資訊
    purchase_price = Column(Numeric(12, 2), nullable=True)
    purchase_currency = Column(String(3), nullable=True)
    purchase_fx_rate = Column(Numeric(12, 6), nullable=True)
    purchase_date = Column(Date, nullable=True)

    # 座標
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    # 狀態
    status = Column(Integer, nullable=False, default=1, index=True)

    # 審計欄位
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    country = relationship("Country", back_populates="properties")
    owner_user = relationship("User", back_populates="properties_owned")

    leases = relationship(
        "Lease", 
        back_populates="property",
        cascade="all, delete-orphan"
    )

    access_list = relationship(
        "PropertyAccess",
        back_populates="property",
        cascade="all, delete-orphan"
    )

    expenses = relationship(
        "Expense",
        back_populates="property",
        cascade="all, delete-orphan"
    )

    utility_bills = relationship(
        "UtilityBill",
        back_populates="property",
        cascade="all, delete-orphan"
    )

    tax_records = relationship(
        "TaxRecord",
        back_populates="property",
        cascade="all, delete-orphan"
    )

    ledger_entries = relationship(
        "LedgerEntry",
        back_populates="property",
        cascade="all, delete-orphan"
    )
