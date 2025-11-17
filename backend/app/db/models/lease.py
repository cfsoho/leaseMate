# app/models/lease.py

from sqlalchemy import (
    Column, String, Date, DateTime, ForeignKey,
    Integer, Numeric, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class Lease(Base):
    __tablename__ = "leases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 所屬物件
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id"),
        nullable=False,
        index=True
    )

    # 房東（簽約名義人）
    landlord_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # 房客
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,   # 草稿時可以先不指定房客
        index=True
    )

    # 仲介（可為空）
    agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    # 租期
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # 金額（每期應付租金）
    rent_amount = Column(Numeric(10, 2), nullable=False)
    rent_currency = Column(String(3), nullable=False, default="THB")

    # 押金（可選）
    deposit_amount = Column(Numeric(10, 2), nullable=True)
    deposit_currency = Column(String(3), nullable=True)

    # 每月幾號應付
    due_day = Column(Integer, nullable=False, default=1)

    # 每幾個月付一次租金（1、2、3、6、12）
    payment_cycle = Column(Integer, nullable=False, default=1)

    # 1 = active, 0 = inactive
    status = Column(Integer, nullable=False, default=1, index=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    property = relationship("Property", back_populates="leases")

    landlord_user = relationship(
        "User",
        foreign_keys=[landlord_id],
        back_populates="leases_as_owner"
    )
    tenant_user = relationship(
        "User",
        foreign_keys=[tenant_id],
        back_populates="leases_as_tenant"
    )
    agent_user = relationship(
        "User",
        foreign_keys=[agent_id],
        back_populates="leases_as_agent"
    )

    payments = relationship(
        "Payment",
        back_populates="lease",
        cascade="all, delete-orphan"
    )

    coverage_entries = relationship(
        "PaymentCoverage",
        back_populates="lease",
        cascade="all, delete-orphan"
    )
