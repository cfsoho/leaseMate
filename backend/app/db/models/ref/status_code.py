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


STATUS_CODE_IDS = {
    "PROPERTY_ACTIVE": uuid.UUID("6b092ed8-39ed-47ce-93fd-94cf1b121e1c"),
    "PROPERTY_INACTIVE": uuid.UUID("13d8d10a-3a19-44bf-bdc9-14c40a69814b"),
    "PROPERTY_SOLD": uuid.UUID("7b2a812f-ea02-4356-b31a-e6f596eb7bb5"),
    "PROPERTY_ARCHIVED": uuid.UUID("758111fd-ea86-46a8-b84a-fca41f9adddb"),
    "LEASE_DRAFT": uuid.UUID("cf99c507-0c69-4afe-b056-005fce557357"),
    "LEASE_ACTIVE": uuid.UUID("72818a71-d566-4838-9f05-99792dded273"),
    "LEASE_EXPIRED": uuid.UUID("f48e4682-2ef4-4c67-93b6-41bc64714c27"),
    "LEASE_TERMINATED": uuid.UUID("abfb71e2-f2f7-40ed-8fbf-e3c983ac2c9c"),
    "LEASE_CANCELLED": uuid.UUID("282dd605-1910-433e-a1f5-268ea091e702"),
    "EXPENSE_PENDING": uuid.UUID("aa38978e-8e45-43cc-90f1-c863f261ef82"),
    "EXPENSE_IN_PROGRESS": uuid.UUID("69bf95cf-b416-425b-9643-d16e815712da"),
    "EXPENSE_COMPLETED": uuid.UUID("6a70acdd-3580-4934-99f4-28fed3cd7e15"),
    "EXPENSE_PAID": uuid.UUID("d69c33eb-fd38-472c-8b9f-93eb0c946274"),
    "RENT_PERIOD_PENDING": uuid.UUID("7318351c-746f-4472-9124-1009b1b816c8"),
    "RENT_PERIOD_PARTIALLY_PAID": uuid.UUID("71f4cf32-0aae-4cfd-bdc2-e21df158bf69"),
    "RENT_PERIOD_PAID": uuid.UUID("38bba064-9a80-4339-886c-9de53c11b13b"),
    "RENT_PERIOD_OVERDUE": uuid.UUID("cba177ed-67ae-49fa-9f13-7e8a6422b7a5"),
    "RENT_PERIOD_CANCELLED": uuid.UUID("9219bcd4-ddd9-4835-8261-9a2b97443090"),
    "DEPOSIT_PENDING": uuid.UUID("5d01af0c-b128-4ae7-85c9-d906e676b054"),
    "DEPOSIT_RECEIVED": uuid.UUID("19a786a3-2871-43c5-83b2-59208c9d8337"),
    "DEPOSIT_PARTIALLY_REFUNDED": uuid.UUID("7783769a-f2aa-43b0-b2f9-c644197b9228"),
    "DEPOSIT_REFUNDED": uuid.UUID("748c1f18-1cef-44d9-bb5c-c17df1cfc354"),
    "DEPOSIT_FORFEITED": uuid.UUID("a6219b70-3bee-4d4b-b8d5-d6e2f89d1974"),
    "UTILITY_BILL_PENDING": uuid.UUID("928f5510-542b-4785-a7eb-e75532fb9c45"),
    "UTILITY_BILL_PAID": uuid.UUID("fc8a66ba-d38c-4f2b-907e-ea048fb49fc3"),
    "UTILITY_BILL_OVERDUE": uuid.UUID("d1a981f5-9f4e-4470-a82d-ff45b115cbf8"),
    "UTILITY_BILL_CANCELLED": uuid.UUID("4e4409f3-d12a-408d-9d8c-fdbd4cb81de4"),
    "RECURRING_SCHEDULE_ACTIVE": uuid.UUID("c60d3fd5-e93d-40e4-ad78-48d335ccaf1e"),
    "RECURRING_SCHEDULE_PAUSED": uuid.UUID("ac9e6c16-2a71-409e-8350-844b856142e2"),
    "RECURRING_SCHEDULE_ENDED": uuid.UUID("8f631d79-6721-4570-b1cc-b8be58a359ff"),
    "REMINDER_PENDING": uuid.UUID("ac5235f7-7d0b-4aa8-95f5-f606518fe73a"),
    "REMINDER_COMPLETED": uuid.UUID("4237fa77-ef1f-433e-848f-dc5851f340de"),
    "REMINDER_DISMISSED": uuid.UUID("1b1ccc50-f1cc-4b02-b9ba-d666bf7a40a0"),
    "REMINDER_CANCELLED": uuid.UUID("a7b636be-dce7-4a80-af4e-3ee3ef8aea72"),
}


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
    is_terminal = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this status normally ends the workflow."
    )
    is_success = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this status represents a successful or desired completion state."
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
