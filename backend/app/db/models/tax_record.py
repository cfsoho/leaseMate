import uuid

from sqlalchemy import (
    Column,
    Date,
    Numeric,
    String,
    DateTime,
    ForeignKey,
    Integer,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class TaxRecord(Base):
    __tablename__ = "tax_records"

    # Internal tax record UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Related property.
    #
    # Indicates which property this tax record belongs to.
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # Country/jurisdiction where the tax applies.
    #
    # Examples:
    # Thailand
    # Japan
    # Taiwan
    country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        nullable=False,
        index=True
    )

    # Tax reporting year.
    #
    # Examples:
    # 2024
    # 2025
    tax_year = Column(
        Integer,
        nullable=False,
        index=True
    )

    # Stable tax type code.
    #
    # Used for:
    # - reporting
    # - filtering
    # - accounting integration
    # - future multilingual display mapping
    #
    # Examples:
    # RENTAL_INCOME
    # PROPERTY_TAX
    # WITHHOLDING_TAX
    # CAPITAL_GAIN
    # OTHER
    tax_type_code = Column(
        String(50),
        nullable=False,
        index=True
    )

    # Currency used for tax amounts.
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

    # Amount declared to tax authority.
    #
    # May differ from actual paid amount.
    declared_amount = Column(
        Numeric(12, 2),
        nullable=True
    )

    # Actual amount paid to tax authority.
    paid_amount = Column(
        Numeric(12, 2),
        nullable=True
    )

    # Date tax payment was made.
    paid_date = Column(
        Date,
        nullable=True
    )

    # Freeform notes/comments.
    #
    # Examples:
    # annual rental income filing
    # late filing penalty included
    # accountant submitted manually
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

    # Relationships

    property = relationship(
        "Property",
        back_populates="tax_records"
    )

    country = relationship("Country")