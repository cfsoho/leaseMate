import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class FinancialInstitution(Base):
    __tablename__ = "financial_institutions"
    __table_args__ = (
        UniqueConstraint(
            "country_id",
            "name",
            name="uq_financial_institution_country_name"
        ),
        {"schema": "ref"},
    )

    # Bank / financial company level UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Financial institution UUID."
    )

    # Country where the institution is based.
    country_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.countries.id"),
        nullable=False,
        index=True,
        comment="Country where the financial institution is based."
    )

    # Official institution name.
    # Examples: Bangkok Bank, Kasikorn Bank, Wise
    name = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Official financial institution name."
    )

    # Institution-level SWIFT/BIC code.
    swift_code = Column(
        String(20),
        nullable=True,
        index=True,
        comment="Institution-level SWIFT or BIC code."
    )

    # Official website.
    website = Column(
        String(255),
        nullable=True,
        comment="Official website for this financial institution."
    )

    # Whether this institution is selectable.
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        comment="Whether this institution can be selected in forms."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the financial institution row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the financial institution row was last updated."
    )

    country = relationship("Country")

    branches = relationship(
        "FinancialInstitutionBranch",
        back_populates="financial_institution",
        cascade="all, delete-orphan"
    )
