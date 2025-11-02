from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Lease(Base):
    __tablename__ = "lease"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)