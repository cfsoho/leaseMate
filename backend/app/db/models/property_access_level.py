import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Enum,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base
from app.db.models.enums.property_access_level_code import PropertyAccessLevelCode


class PropertyAccessLevel(Base):
    __tablename__ = "property_access_levels"

    # Shared multilingual UUID identifier.
    #
    # Same id across locales:
    # id=AAA + locale=en     -> Owner
    # id=AAA + locale=zh-TW  -> 所有人
    # id=AAA + locale=th     -> เจ้าของ
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Locale code.
    #
    # Examples:
    # en
    # zh-TW
    # th
    locale = Column(String(10), primary_key=True)

    # System-controlled access level code.
    #
    # This is an enum because access levels are:
    # - finite
    # - security-related
    # - controlled by the application
    # - not freely user-defined
    code = Column(
        Enum(PropertyAccessLevelCode),
        nullable=False,
        index=True
    )

    # Localized display name.
    #
    # Examples:
    # Owner
    # 所有人
    # เจ้าของ
    name = Column(String(50), nullable=False)

    # Optional localized description/help text.
    description = Column(String(255), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "code",
            "locale",
            name="uq_property_access_level_code_locale"
        ),
    )