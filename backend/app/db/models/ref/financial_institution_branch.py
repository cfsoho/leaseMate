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


class FinancialInstitutionBranch(Base):
    __tablename__ = "financial_institution_branches"
    __table_args__ = (
        UniqueConstraint(
            "financial_institution_id",
            "branch_name",
            name="uq_financial_institution_branch_name"
        ),
        {"schema": "ref"},
    )

    # Branch-level UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Financial institution branch UUID."
    )

    # Parent financial institution.
    financial_institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.financial_institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent financial institution UUID."
    )

    # Branch display name.
    # Examples: Asoke Branch, Shinjuku Branch
    branch_name = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Branch display name."
    )

    # Local branch code used by bank.
    branch_code = Column(
        String(50),
        nullable=True,
        index=True,
        comment="Local branch code used by the bank."
    )

    # Branch address.
    address = Column(
        String(255),
        nullable=True,
        comment="Branch address."
    )

    # Branch phone number.
    phone = Column(
        String(50),
        nullable=True,
        comment="Branch phone number."
    )

    # Whether this branch is selectable.
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        comment="Whether this branch can be selected in forms."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the branch row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the branch row was last updated."
    )

    financial_institution = relationship(
        "FinancialInstitution",
        back_populates="branches"
    )
