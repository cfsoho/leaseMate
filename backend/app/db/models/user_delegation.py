import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserDelegation(Base):
    __tablename__ = "user_delegations"

    # A delegation lets one individual manage selected records for another
    # individual, for example managing a parent's legal names or bank accounts.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Individual whose records are being managed.
    subject_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Individual allowed to manage the subject user's records.
    delegate_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Human relationship label only, e.g. FAMILY, ASSISTANT, PROPERTY_MANAGER.
    relationship_type = Column(String(50), nullable=False)

    can_view_legal_names = Column(Boolean, nullable=False, default=False)
    can_manage_legal_names = Column(Boolean, nullable=False, default=False)
    can_view_bank_accounts = Column(Boolean, nullable=False, default=False)
    can_manage_bank_accounts = Column(Boolean, nullable=False, default=False)
    can_view_user_account_info = Column(Boolean, nullable=False, default=False)
    can_manage_user_account_info = Column(Boolean, nullable=False, default=False)
    can_view_properties = Column(Boolean, nullable=False, default=False)
    can_manage_properties = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "subject_user_id",
            "delegate_user_id",
            name="uq_user_delegation_subject_delegate",
        ),
        CheckConstraint(
            "subject_user_id <> delegate_user_id",
            name="ck_user_delegation_no_self",
        ),
        CheckConstraint(
            "can_view_legal_names OR can_manage_legal_names "
            "OR can_view_bank_accounts OR can_manage_bank_accounts "
            "OR can_view_user_account_info OR can_manage_user_account_info "
            "OR can_view_properties OR can_manage_properties",
            name="ck_user_delegation_has_allowed_access",
        ),
    )

    subject_user = relationship(
        "User",
        foreign_keys=[subject_user_id],
        back_populates="delegations_received",
    )
    delegate_user = relationship(
        "User",
        foreign_keys=[delegate_user_id],
        back_populates="delegations_given",
    )
