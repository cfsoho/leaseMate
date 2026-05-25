from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

class RoleCreate(BaseModel):
    code: str


class RoleUpdate(BaseModel):
    code: Optional[str] = None


class RoleRead(BaseModel):
    id: UUID
    code: str
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
