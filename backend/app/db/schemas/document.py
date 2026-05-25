from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    document_type_id: UUID

    file_name: str = Field(max_length=255)
    stored_name: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    mime_type: str = Field(max_length=100)
    size: int

    version: int = 1
    status: str = "DRAFT"
    visibility: str = "OWNER_ONLY"

    uploaded_by: Optional[UUID] = None


class DocumentUpdate(BaseModel):
    document_type_id: Optional[UUID] = None

    file_name: Optional[str] = Field(default=None, max_length=255)
    stored_name: Optional[str] = Field(default=None, max_length=255)
    file_path: Optional[str] = Field(default=None, max_length=500)
    mime_type: Optional[str] = Field(default=None, max_length=100)
    size: Optional[int] = None

    version: Optional[int] = None
    status: Optional[str] = None
    visibility: Optional[str] = None

    uploaded_by: Optional[UUID] = None
    is_deleted: Optional[bool] = None
    deleted_at: Optional[datetime] = None


class DocumentRead(BaseModel):
    id: UUID

    document_type_id: UUID

    file_name: str
    stored_name: str
    file_path: str
    mime_type: str
    size: int

    version: int
    status: str
    visibility: str

    uploaded_by: Optional[UUID]

    created_at: datetime
    updated_at: Optional[datetime]
    is_deleted: bool
    deleted_at: Optional[datetime]

    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
