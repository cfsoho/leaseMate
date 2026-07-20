import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Display/property nickname
    name = Column(String(100), nullable=False)

    # Shared building/location record.
    #
    # Multiple properties can belong to the same building.
    # Examples:
    # - several condo units in the same Bangkok building
    # - several Tokyo apartments in the same mansion
    building_id = Column(
        UUID(as_uuid=True),
        ForeignKey("property_buildings.id"),
        nullable=False,
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

    # Property lifecycle status.
    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="Current lifecycle status for this property."
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    building = relationship("PropertyBuilding", back_populates="properties")
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
