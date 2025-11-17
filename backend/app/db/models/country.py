# app/db/models/country.py

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class Country(Base):
    __tablename__ = "countries"
    __table_args__ = {"schema": "ref"}  # stored in ref schema

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    code = Column(String(3), unique=True, index=True, nullable=False, comment="ISO 3166-1 alpha-3 code")
    alpha2 = Column(String(2), unique=True, nullable=False, comment="ISO 3166-1 alpha-2 code")

    name = Column(String(100), nullable=False, comment="Official country name")
    phone_prefix = Column(String(6), nullable=True, comment="International dialing code")
    region = Column(String(50), nullable=True, comment="Continent or region name")

    # ISO 4217 currency code (e.g., THB, JPY, TWD)
    currency_code = Column(String(3), nullable=False)

    # Relationships
    properties = relationship("Property", back_populates="country")
