from sqlalchemy import (
    Column, String, Integer
)
from app.db.database import Base

class PropertyAccessLevel(Base):
    __tablename__ = "property_access_levels"

    id = Column(Integer, primary_key=True)  # smallint or int
    name = Column(String(50), unique=True, nullable=False)
