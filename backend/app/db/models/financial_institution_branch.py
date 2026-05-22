import uuid

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class FinancialInstitutionBranch(Base):
    __tablename__ = "financial_institution_branches"

    # Branch-level UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent financial institution.
    financial_institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Branch display name.
    # Examples: Asoke Branch, Shinjuku Branch
    branch_name = Column(String(100), nullable=False, index=True)

    # Local branch code used by bank.
    branch_code = Column(String(50), nullable=True, index=True)

    # Branch address.
    address = Column(String(255), nullable=True)

    # Branch phone number.
    phone = Column(String(50), nullable=True)

    # Whether this branch is selectable.
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    financial_institution = relationship(
        "FinancialInstitution",
        back_populates="branches"
    )