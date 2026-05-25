import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class ContractorType(Base):
    __tablename__ = "contractor_types"
    __table_args__ = (
        UniqueConstraint("code", "locale", name="uq_contractor_type_code_locale"),
        {"schema": "ref"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    locale = Column(String(35), primary_key=True)

    code = Column(String(50), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
