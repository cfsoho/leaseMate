from sqlalchemy import Boolean, Column, DateTime, String, func

from app.db.database import Base


class RefCodeMixin:
    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class RoleCodeRef(RefCodeMixin, Base):
    __tablename__ = "role_codes"
    __table_args__ = {"schema": "ref"}


class UserStatusRef(RefCodeMixin, Base):
    __tablename__ = "user_statuses"
    __table_args__ = {"schema": "ref"}


class UserVerificationTokenTypeRef(RefCodeMixin, Base):
    __tablename__ = "user_verification_token_types"
    __table_args__ = {"schema": "ref"}


class PropertyAccessLevelCodeRef(RefCodeMixin, Base):
    __tablename__ = "property_access_level_codes"
    __table_args__ = {"schema": "ref"}


class DocumentStatusRef(RefCodeMixin, Base):
    __tablename__ = "document_statuses"
    __table_args__ = {"schema": "ref"}


class DocumentVisibilityRef(RefCodeMixin, Base):
    __tablename__ = "document_visibilities"
    __table_args__ = {"schema": "ref"}


class DocumentObjectTypeRef(RefCodeMixin, Base):
    __tablename__ = "document_object_types"
    __table_args__ = {"schema": "ref"}


class FinancialTransactionSourceTypeRef(RefCodeMixin, Base):
    __tablename__ = "financial_transaction_source_types"
    __table_args__ = {"schema": "ref"}


class LedgerEntryTypeRef(RefCodeMixin, Base):
    __tablename__ = "ledger_entry_types"
    __table_args__ = {"schema": "ref"}

    is_income = Column(Boolean, nullable=False, default=False)
