# property.py
from sqlalchemy import (
    Column, String, Integer, ForeignKey,
    Numeric, DateTime, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


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
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    purchase_price = Column(Numeric(12, 2), nullable=True, comment="Buying price")
    purchase_currency = Column(String(3), nullable=True, comment="Currency of purchase price")
    purchase_fx_rate = Numeric(12,6)   # 如 0.29 
    purchase_date = Column(Date, nullable=True, comment="Date of purchase")


    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    status = Column(Integer, nullable=False, default=1, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    country = relationship("Country", back_populates="properties")
    owner_user = relationship("User", back_populates="properties_owned")

    leases = relationship("Lease", back_populates="property")
    access_list = relationship("PropertyAccess", back_populates="property")
    expenses = relationship("Expense", back_populates="property")
    utility_bills = relationship("UtilityBill", back_populates="property")
    tax_records = relationship("TaxRecord", back_populates="property")
    ledger_entries = relationship("LedgerEntry", back_populates="property")




