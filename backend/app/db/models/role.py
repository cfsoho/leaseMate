import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Enum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.models.enums.role_code import RoleCode


class Role(Base):
    __tablename__ = "roles"

    # Internal role UUID.
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
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
        Enum(RoleCode),
        nullable=False,
        unique=True,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Users assigned to this role.
    users = relationship(
        "User",
        back_populates="role"
    )