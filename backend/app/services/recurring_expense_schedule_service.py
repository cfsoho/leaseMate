from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.recurring_expense_schedule import RecurringExpenseSchedule
from app.db.schemas.recurring_expense_schedule import (
    RecurringExpenseScheduleCreate,
    RecurringExpenseScheduleUpdate,
)

from app.services.soft_delete import soft_delete
from app.services.status_defaults import apply_default_status

def create_recurring_expense_schedule(
    db: Session,
    payload: RecurringExpenseScheduleCreate
) -> RecurringExpenseSchedule:
    data = apply_default_status(
        db,
        payload.model_dump(),
        group_code="RECURRING_SCHEDULE",
        code="ACTIVE",
    )
    schedule = RecurringExpenseSchedule(**data)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


def get_recurring_expense_schedule(
    db: Session,
    schedule_id: UUID
) -> Optional[RecurringExpenseSchedule]:
    return (
        db.query(RecurringExpenseSchedule)
        .filter(RecurringExpenseSchedule.id == schedule_id)
        .first()
    )


def get_recurring_expense_schedules(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RecurringExpenseSchedule).offset(skip).limit(limit).all()


def update_recurring_expense_schedule(
    db: Session,
    schedule_id: UUID,
    payload: RecurringExpenseScheduleUpdate
) -> Optional[RecurringExpenseSchedule]:
    schedule = get_recurring_expense_schedule(db, schedule_id)
    if not schedule:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


def delete_recurring_expense_schedule(db: Session, schedule_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    schedule = get_recurring_expense_schedule(db, schedule_id)
    if not schedule:
        return False
    soft_delete(db, schedule, deleted_by)
    return True
