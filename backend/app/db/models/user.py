from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique user identifier (UUID)"
    )
    s_name = Column(String(50), nullable=False, comment="Given name")
    f_name = Column(String(50), nullable=False, comment="Surname / Family name")
    m_name = Column(String(50), nullable=True, comment="Middle name")
    email = Column(String(254), unique=True, nullable=False, index=True, comment="User login email")
    pwd = Column(String(128), unique=True, nullable=False, comment="Hashed password")
    phone = Column(String(20), nullable=True, comment="Phone number (optional)")
