from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.recurring_expense_schedule import (
    RecurringExpenseScheduleCreate,
    RecurringExpenseScheduleRead,
    RecurringExpenseScheduleUpdate,
)
from app.services.recurring_expense_schedule_service import (
    create_recurring_expense_schedule,
    delete_recurring_expense_schedule,
    get_recurring_expense_schedule,
    get_recurring_expense_schedules,
    update_recurring_expense_schedule,
)


router = APIRouter(
    prefix="/recurring-expense-schedules",
    tags=["Recurring Expense Schedules"],
    dependencies=[Depends(require_current_user)]
)


@router.post("", response_model=RecurringExpenseScheduleRead)
def create(payload: RecurringExpenseScheduleCreate, db: Session = Depends(get_db)):
    return create_recurring_expense_schedule(db, payload)


@router.get("", response_model=List[RecurringExpenseScheduleRead])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_recurring_expense_schedules(db, skip, limit)


@router.get("/{schedule_id}", response_model=RecurringExpenseScheduleRead)
def get_one(schedule_id: UUID, db: Session = Depends(get_db)):
    schedule = get_recurring_expense_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Recurring expense schedule not found")
    return schedule


@router.put("/{schedule_id}", response_model=RecurringExpenseScheduleRead)
def update(
    schedule_id: UUID,
    payload: RecurringExpenseScheduleUpdate,
    db: Session = Depends(get_db)
):
    schedule = update_recurring_expense_schedule(db, schedule_id, payload)
    if not schedule:
        raise HTTPException(status_code=404, detail="Recurring expense schedule not found")
    return schedule


@router.delete("/{schedule_id}")
def delete(
    schedule_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_recurring_expense_schedule(db, schedule_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Recurring expense schedule not found")
    return {"message": "Recurring expense schedule deleted successfully"}
