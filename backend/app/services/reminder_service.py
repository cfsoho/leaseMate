from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.reminder import Reminder
from app.db.schemas.reminder import ReminderCreate, ReminderUpdate

from app.services.soft_delete import soft_delete
from app.services.status_defaults import apply_default_status

def create_reminder(db: Session, payload: ReminderCreate) -> Reminder:
    data = apply_default_status(
        db,
        payload.model_dump(),
        group_code="REMINDER",
        code="PENDING",
    )
    reminder = Reminder(**data)
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def get_reminder(db: Session, reminder_id: UUID) -> Optional[Reminder]:
    return db.query(Reminder).filter(Reminder.id == reminder_id).first()


def get_reminders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Reminder).offset(skip).limit(limit).all()


def update_reminder(
    db: Session,
    reminder_id: UUID,
    payload: ReminderUpdate
) -> Optional[Reminder]:
    reminder = get_reminder(db, reminder_id)
    if not reminder:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)
    return reminder


def delete_reminder(db: Session, reminder_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    reminder = get_reminder(db, reminder_id)
    if not reminder:
        return False
    soft_delete(db, reminder, deleted_by)
    return True
