from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.models.enums.role_code import RoleCode


class RoleCreate(BaseModel):
    code: RoleCode
    name: str


class RoleUpdate(BaseModel):
    code: Optional[RoleCode] = None
    name: Optional[str] = None


class RoleRead(BaseModel):
    id: UUID
    code: RoleCode
    name: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True