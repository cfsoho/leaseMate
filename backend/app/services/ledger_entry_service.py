from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ledger_entry import LedgerEntry
from app.db.schemas.ledger_entry import LedgerEntryCreate, LedgerEntryUpdate


def create_ledger_entry(
    db: Session,
    payload: LedgerEntryCreate
) -> LedgerEntry:
    ledger_entry = LedgerEntry(**payload.model_dump())

    db.add(ledger_entry)
    db.commit()
    db.refresh(ledger_entry)

    return ledger_entry


def get_ledger_entry(
    db: Session,
    ledger_entry_id: UUID
) -> Optional[LedgerEntry]:
    return (
        db.query(LedgerEntry)
        .filter(LedgerEntry.id == ledger_entry_id)
        .first()
    )


def get_ledger_entries(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(LedgerEntry)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_ledger_entry(
    db: Session,
    ledger_entry_id: UUID,
    payload: LedgerEntryUpdate
) -> Optional[LedgerEntry]:
    ledger_entry = get_ledger_entry(db, ledger_entry_id)

    if not ledger_entry:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(ledger_entry, field, value)

    db.commit()
    db.refresh(ledger_entry)

    return ledger_entry


def delete_ledger_entry(
    db: Session,
    ledger_entry_id: UUID
) -> bool:
    ledger_entry = get_ledger_entry(db, ledger_entry_id)

    if not ledger_entry:
        return False

    db.delete(ledger_entry)
    db.commit()

    return True