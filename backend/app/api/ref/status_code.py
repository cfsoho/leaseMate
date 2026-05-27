from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.status_code import (
    StatusCodeCreate,
    StatusCodeRead,
    StatusCodeUpdate,
)
from app.services.ref.status_code_service import (
    create_status_code,
    delete_status_code,
    get_status_code,
    get_status_codes,
    update_status_code,
)


router = APIRouter(prefix="/status-codes", tags=["Status Codes"], dependencies=[Depends(require_admin)])


@router.post("", response_model=StatusCodeRead)
def create(payload: StatusCodeCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return create_status_code(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=List[StatusCodeRead])
def list_all(
    locale: str = "en",
    group_code: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_status_codes(db, locale, group_code, skip, limit)


@router.get("/{status_code_id}/{locale}", response_model=StatusCodeRead)
def get_one(status_code_id: UUID, locale: str, db: Session = Depends(get_db)):
    status_code = get_status_code(db, status_code_id, locale)
    if not status_code:
        raise HTTPException(status_code=404, detail="Status code not found")
    return status_code


@router.put("/{status_code_id}/{locale}", response_model=StatusCodeRead)
def update(
    status_code_id: UUID,
    locale: str,
    payload: StatusCodeUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        status_code = update_status_code(db, status_code_id, locale, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not status_code:
        raise HTTPException(status_code=404, detail="Status code not found")
    return status_code


@router.delete("/{status_code_id}/{locale}")
def delete(
    status_code_id: UUID,
    locale: str,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_status_code(db, status_code_id, locale, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Status code not found")
    return {"message": "Status code deleted successfully"}
