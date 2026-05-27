import uuid

from sqlalchemy import (
    Boolean,
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    # Internal transaction UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Financial account this transaction belongs to.
    financial_account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Source/business type of this transaction.
    #
    # Examples:
    # PAYMENT              -> rent payment received
    # EXPENSE              -> contractor/repair payment
    # UTILITY_BILL         -> utility payment
    # TAX_RECORD           -> tax payment
    # PERSONAL_DEPOSIT     -> owner adds money
    # PERSONAL_WITHDRAWAL  -> owner takes money out
    # OPENING_BALANCE      -> first balance entry
    source_type = Column(
        String(50),
        ForeignKey("ref.financial_transaction_source_types.code"),
        nullable=False,
        index=True
    )

    # UUID of the source object.
    #
    # Examples:
    # source_type = PAYMENT
    # source_id   = payments.id
    #
    # source_type = UTILITY_BILL
    # source_id   = utility_bills.id
    #
    # Nullable for:
    # - OPENING_BALANCE
    # - PERSONAL_DEPOSIT
    # - PERSONAL_WITHDRAWAL
    # - OTHER
    source_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    # Transaction date.
    #
    # Date only, because manual entry should not require time.
    transaction_date = Column(
        Date,
        nullable=False,
        index=True
    )

    # Money coming into the account.
    #
    # Only one of deposit_amount / withdrawal_amount
    # should be filled per transaction.
    deposit_amount = Column(
        Numeric(12, 2),
        nullable=True
    )

    # Money going out of the account.
    withdrawal_amount = Column(
        Numeric(12, 2),
        nullable=True
    )

    # Account balance after this transaction.
    #
    # Passbook-style balance.
    balance_after = Column(
        Numeric(12, 2),
        nullable=False
    )

    # Currency of this transaction.
    currency_code = Column(
        String(3),
        nullable=False,
        default="THB"
    )

    # Other party involved in the transaction.
    #
    # Examples:
    # tenant name
    # contractor name
    # electric company
    counterparty = Column(
        String(100),
        nullable=True
    )

    # Bank/payment reference number.
    reference_no = Column(
        String(100),
        nullable=True,
        index=True
    )

    # Freeform notes.
    notes = Column(
        String(255),
        nullable=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True, index=True)

    financial_account = relationship(
        "FinancialAccount",
        back_populates="transactions"
    )
