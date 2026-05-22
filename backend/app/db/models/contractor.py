import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(100), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)

    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(100), nullable=True, index=True)

    # Shared multilingual contractor type id.
    # The display language is resolved by frontend/user locale.
    contractor_type_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    address = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    expenses = relationship(
        "Expense",
        back_populates="contractor"
    )