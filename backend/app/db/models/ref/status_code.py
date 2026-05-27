import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class StatusCode(Base):
    __tablename__ = "status_codes"
    __table_args__ = (
        UniqueConstraint("group_code", "code", "locale", name="uq_status_code_group_code_locale"),
        {"schema": "ref"},
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Shared multilingual status UUID stored by business tables as status_id."
    )
    locale = Column(
        String(35),
        primary_key=True,
        comment="Locale code for this translated status row."
    )
    group_code = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Business area this status belongs to, such as PROPERTY, LEASE, or EXPENSE."
    )
    code = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Stable internal status code used by backend logic and seed upserts."
    )
    name = Column(
        String(100),
        nullable=False,
        comment="Localized display name for this status."
    )
    description = Column(
        String(255),
        nullable=True,
        comment="Optional localized help text for this status."
    )

    # Terminal means this status normally ends a workflow.
    #
    # Examples:
    # - LEASE_CANCELLED ends the lease workflow.
    # - EXPENSE_PAID ends the expense workflow.
    # - REMINDER_COMPLETED ends the reminder workflow.
    #
    # This is useful for later logic such as hiding closed work,
    # blocking edits after completion, or reporting open vs closed items.
    is_terminal = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this status normally ends a workflow, such as cancelled, paid, completed, or expired."
    )

    # Success means a terminal status ended in the intended/good result.
    #
    # Examples:
    # - EXPENSE_PAID is terminal and successful.
    # - REMINDER_COMPLETED is terminal and successful.
    # - LEASE_CANCELLED is terminal, but not successful.
    #
    # This is useful for dashboards, reports, and filters like
    # completed successfully vs closed for another reason.
    is_success = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this terminal status represents a successful or desired completion result."
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this status can be selected for new records."
    )
    sort_order = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Display order within the same status group."
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the status code row was created."
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the status code row was last updated."
    )
