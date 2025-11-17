# app/models/document_type.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from app.db.database import Base

class DocumentType(Base):
    __tablename__ = "document_types"

    id = Column(Integer, primary_key=True)
    
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
