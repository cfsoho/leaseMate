import uuid

from sqlalchemy import (
    Column,
    String,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

class FinancialAccount(Base):
    __tablename__ = "financial_accounts"

    # Internal UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who owns this financial account.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Official/legal name used as the account holder name.
    legal_name_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_legal_names.id"),
        nullable=True,
        index=True
    )

    # Financial institution branch platform.
    # Nullable for CASH account.
    financial_institution_branch_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ref.financial_institution_branches.id"),
        nullable=True,
        index=True
    )

    # Bank/account number or identifier.
    account_number = Column(String(100), nullable=True)

    # Account currency.
    currency_code = Column(String(3), nullable=False, default="THB")

    # Latest balance of this account.
    # Updated when financial transactions are added.
    current_balance = Column(Numeric(12, 2), nullable=False, default=0)

    # Whether this account is active/selectable.
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    # Freeform notes.
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship("User")
    legal_name = relationship("UserLegalName")
    financial_institution_branch = relationship("FinancialInstitutionBranch")

    transactions = relationship(
        "FinancialTransaction",
        back_populates="financial_account",
        cascade="all, delete-orphan"
    )
