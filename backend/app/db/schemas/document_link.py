from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentLinkCreate(BaseModel):
    document_id: UUID
    object_type: str
    object_id: UUID


class DocumentLinkUpdate(BaseModel):
    document_id: Optional[UUID] = None
    object_type: Optional[str] = None
    object_id: Optional[UUID] = None


class DocumentLinkRead(BaseModel):
    id: UUID

    document_id: UUID
    object_type: str
    object_id: UUID

    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
