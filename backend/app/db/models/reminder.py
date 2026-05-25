import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.ref.status_code import STATUS_CODE_IDS


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    reminder_type = Column(String(50), nullable=False, index=True)
    target_type = Column(
        String(50),
        ForeignKey("ref.document_object_types.code"),
        nullable=True,
        index=True
    )
    target_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=True)

    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        default=STATUS_CODE_IDS["REMINDER_PENDING"],
        index=True,
        comment="Current reminder workflow status."
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship("User")
    property = relationship("Property", back_populates="reminders")
