from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LocaleCreate(BaseModel):
    code: str
    name: str
    native_name: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    is_default: bool = False


class LocaleUpdate(BaseModel):
    name: Optional[str] = None
    native_name: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    is_default: Optional[bool] = None


class LocaleRead(BaseModel):
    code: str
    name: str
    native_name: Optional[str]
    is_active: bool
    sort_order: int
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True