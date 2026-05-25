import uuid

from sqlalchemy import (
    Column, String, ForeignKey,
    Numeric, Date, DateTime, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.ref.status_code import STATUS_CODE_IDS


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Display/property nickname
    name = Column(String(100), nullable=False)

    building_name = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    zipcode = Column(String(20), nullable=True)

    # Physical/legal country of the property
    country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        nullable=True,
        index=True
    )

    # Legal owner / property certificate owner
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Official/legal ownership name used for this property.
    #
    # Examples:
    # Name on land title
    # Name on chanote
    # Registered owner name
    #
    # This may differ from:
    # - login/display name
    # - bank account name
    # - other country legal names
    legal_name_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_legal_names.id"),
        nullable=True,
        index=True
    )

    # Purchase information
    purchase_price = Column(Numeric(12, 2), nullable=True)
    purchase_currency = Column(String(3), nullable=True)
    purchase_fx_rate = Column(Numeric(12, 6), nullable=True)
    purchase_date = Column(Date, nullable=True)

    # Geo coordinates
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    # Property lifecycle status.
    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        default=STATUS_CODE_IDS["PROPERTY_ACTIVE"],
        index=True,
        comment="Current lifecycle status for this property."
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    country = relationship("Country", back_populates="properties")
    owner_user = relationship("User", back_populates="properties_owned")
    legal_name = relationship("UserLegalName")

    leases = relationship("Lease", back_populates="property", cascade="all, delete-orphan")
    access_list = relationship("PropertyAccess", back_populates="property", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="property", cascade="all, delete-orphan")
    utility_bills = relationship("UtilityBill", back_populates="property", cascade="all, delete-orphan")
    tax_records = relationship("TaxRecord", back_populates="property", cascade="all, delete-orphan")
    ledger_entries = relationship("LedgerEntry", back_populates="property", cascade="all, delete-orphan")
    recurring_expense_schedules = relationship(
        "RecurringExpenseSchedule",
        back_populates="property",
        cascade="all, delete-orphan"
    )
    reminders = relationship(
        "Reminder",
        back_populates="property",
        cascade="all, delete-orphan"
    )
