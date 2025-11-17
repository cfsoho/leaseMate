# app/db/models/property_access_level.py

from sqlalchemy import Column, String, Integer, DateTime, func
from app.db.database import Base

class PropertyAccessLevel(Base):
    __tablename__ = "property_access_levels"

    id = Column(Integer, primary_key=True)   # 1,2,3,4,5
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Integer, nullable=False, default=1)  # 1=active, 0=inactive

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
