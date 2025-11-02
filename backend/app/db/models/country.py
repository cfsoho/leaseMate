from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base
import uuid

class Country(Base):
    __tablename__ = "countries"
    __table_args__ = {"schema": "ref"}  # stored in ref schema

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(3), unique=True, index=True, nullable=False, comment="ISO 3166-1 alpha-3 code")
    name = Column(String(100), nullable=False, comment="Official country name")
    phone_prefix = Column(String(6), nullable=True, comment="International dialing code")
    region = Column(String(50), nullable=True, comment="Continent or region name")
