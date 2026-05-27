from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReminderCreate(BaseModel):
    user_id: Optional[UUID] = None
    property_id: Optional[UUID] = None
    reminder_type: str
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    title: str
    message: Optional[str] = None
    due_at: datetime
    completed_at: Optional[datetime] = None
    status_id: Optional[UUID] = None


class ReminderUpdate(BaseModel):
    user_id: Optional[UUID] = None
    property_id: Optional[UUID] = None
    reminder_type: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    title: Optional[str] = None
    message: Optional[str] = None
    due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status_id: Optional[UUID] = None


class ReminderRead(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    property_id: Optional[UUID]
    reminder_type: str
    target_type: Optional[str]
    target_id: Optional[UUID]
    title: str
    message: Optional[str]
    due_at: datetime
    completed_at: Optional[datetime]
    status_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    is_deleted: bool
    deleted_at: Optional[datetime]
    deleted_by: Optional[UUID]

    class Config:
        from_attributes = True
