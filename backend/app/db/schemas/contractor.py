from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.db.schemas.contractor_type import ContractorTypeRead


class ContractorCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contractor_type_id: Optional[UUID] = None
    address: Optional[str] = None


class ContractorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contractor_type_id: Optional[UUID] = None
    address: Optional[str] = None


class ContractorRead(BaseModel):
    id: UUID
    name: str
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    contractor_type_id: Optional[UUID]
    contractor_type: Optional[ContractorTypeRead]
    address: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True