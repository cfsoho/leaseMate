from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    func,
)

from sqlalchemy.orm import relationship

from app.db.database import Base


class Locale(Base):
    __tablename__ = "locales"
    __table_args__ = {"schema": "ref"}

    # en
    # zh-TW
    # th
    code = Column(String(10), primary_key=True)

    # English
    # Traditional Chinese
    # Thai
    name = Column(String(100), nullable=False)

    # English
    # 繁體中文
    # ไทย
    native_name = Column(String(100), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )