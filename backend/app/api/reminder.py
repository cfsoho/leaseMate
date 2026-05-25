from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.reminder import ReminderCreate, ReminderRead, ReminderUpdate
from app.services.reminder_service import (
    create_reminder,
    delete_reminder,
    get_reminder,
    get_reminders,
    update_reminder,
)


router = APIRouter(prefix="/reminders", tags=["Reminders"], dependencies=[Depends(require_current_user)])


@router.post("", response_model=ReminderRead)
def create(payload: ReminderCreate, db: Session = Depends(get_db)):
    return create_reminder(db, payload)


@router.get("", response_model=List[ReminderRead])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_reminders(db, skip, limit)


@router.get("/{reminder_id}", response_model=ReminderRead)
def get_one(reminder_id: UUID, db: Session = Depends(get_db)):
    reminder = get_reminder(db, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.put("/{reminder_id}", response_model=ReminderRead)
def update(
    reminder_id: UUID,
    payload: ReminderUpdate,
    db: Session = Depends(get_db)
):
    reminder = update_reminder(db, reminder_id, payload)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.delete("/{reminder_id}")
def delete(
    reminder_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_reminder(db, reminder_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted successfully"}
