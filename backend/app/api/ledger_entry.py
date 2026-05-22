from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.ledger_entry import (
    LedgerEntryCreate,
    LedgerEntryUpdate,
    LedgerEntryRead,
)
from app.services.ledger_entry_service import (
    create_ledger_entry,
    get_ledger_entry,
    get_ledger_entries,
    update_ledger_entry,
    delete_ledger_entry,
)

router = APIRouter(
    prefix="/ledger-entries",
    tags=["Ledger Entries"]
)


@router.post("", response_model=LedgerEntryRead)
def create(
    payload: LedgerEntryCreate,
    db: Session = Depends(get_db)
):
    return create_ledger_entry(db, payload)


@router.get("", response_model=List[LedgerEntryRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_ledger_entries(db, skip, limit)


@router.get("/{ledger_entry_id}", response_model=LedgerEntryRead)
def get_one(
    ledger_entry_id: UUID,
    db: Session = Depends(get_db)
):
    ledger_entry = get_ledger_entry(db, ledger_entry_id)

    if not ledger_entry:
        raise HTTPException(
            status_code=404,
            detail="Ledger entry not found"
        )

    return ledger_entry


@router.put("/{ledger_entry_id}", response_model=LedgerEntryRead)
def update(
    ledger_entry_id: UUID,
    payload: LedgerEntryUpdate,
    db: Session = Depends(get_db)
):
    ledger_entry = update_ledger_entry(
        db,
        ledger_entry_id,
        payload
    )

    if not ledger_entry:
        raise HTTPException(
            status_code=404,
            detail="Ledger entry not found"
        )

    return ledger_entry


@router.delete("/{ledger_entry_id}")
def delete(
    ledger_entry_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_ledger_entry(db, ledger_entry_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Ledger entry not found"
        )

    return {
        "message": "Ledger entry deleted successfully"
    }