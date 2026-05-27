import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "ref"}

    # Internal role UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Internal role UUID."
    )

    # System-controlled role code.
    #
    # Used for:
    # - authorization
    # - permission checks
    # - backend logic
    #
    # Examples:
    # ADMIN
    # OWNER
    # USER
    code = Column(
        String(50),
        ForeignKey("ref.role_codes.code"),
        nullable=False,
        unique=True,
        index=True,
        comment="System-controlled role code used for authorization."
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Timestamp when the role row was created."
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp when the role row was last updated."
    )

    # Users assigned to this role.
    users = relationship(
        "User",
        back_populates="role"
    )
