# user.py
from sqlalchemy import (
    Column, String, Integer, ForeignKey,
    DateTime, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    s_name = Column(String(50), nullable=False)
    f_name = Column(String(50), nullable=False)
    m_name = Column(String(50), nullable=True)

    email = Column(String(254), unique=True, nullable=False, index=True)
    pwd = Column(String(128), nullable=False)
    phone = Column(String(20), nullable=True)

    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=True,
        index=True
    )

    # Relationships
    role = relationship("Role", back_populates="users")

    # 🟢 Correct naming
    properties_owned = relationship("Property", back_populates="owner_user")

    leases_as_tenant = relationship("Lease", back_populates="tenant_user", foreign_keys="Lease.tenant_id")
    leases_as_agent = relationship("Lease", back_populates="agent_user", foreign_keys="Lease.agent_id")
    leases_as_owner = relationship("Lease", back_populates="owner_user", foreign_keys="Lease.owner_id")

    property_access = relationship(
        "PropertyAccess",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
