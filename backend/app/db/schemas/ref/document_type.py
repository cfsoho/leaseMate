from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentTypeCreate(BaseModel):
    id: Optional[UUID] = None

    locale: str

    code: str
    name: str
    description: Optional[str] = None

    is_active: bool = True


class DocumentTypeUpdate(BaseModel):
    locale: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DocumentTypeRead(BaseModel):
    id: UUID

    locale: str

    code: str
    name: str
    description: Optional[str]

    is_active: bool

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
