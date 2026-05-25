from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.ref_code import RefCodeCreate, RefCodeRead, RefCodeUpdate
from app.services.ref.ref_code_service import (
    REF_CODE_MODELS,
    create_ref_code,
    delete_ref_code,
    get_ref_code,
    get_ref_codes,
    update_ref_code,
)


router = APIRouter(
    prefix="/ref-codes",
    tags=["Reference Codes"],
    dependencies=[Depends(require_admin)]
)


def ensure_catalog(catalog: str):
    if catalog not in REF_CODE_MODELS:
        raise HTTPException(
            status_code=404,
            detail="Reference code catalog not found"
        )


@router.get("/catalogs", response_model=List[str])
def list_catalogs():
    return sorted(REF_CODE_MODELS.keys())


@router.post("/{catalog}", response_model=RefCodeRead)
def create(
    catalog: str,
    payload: RefCodeCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    ensure_catalog(catalog)
    return create_ref_code(db, catalog, payload)


@router.get("/{catalog}", response_model=List[RefCodeRead])
def list_all(
    catalog: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    ensure_catalog(catalog)
    return get_ref_codes(db, catalog, skip, limit)


@router.get("/{catalog}/{code}", response_model=RefCodeRead)
def get_one(
    catalog: str,
    code: str,
    db: Session = Depends(get_db)
):
    ensure_catalog(catalog)
    row = get_ref_code(db, catalog, code)

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Reference code not found"
        )

    return row


@router.put("/{catalog}/{code}", response_model=RefCodeRead)
def update(
    catalog: str,
    code: str,
    payload: RefCodeUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    ensure_catalog(catalog)
    row = update_ref_code(db, catalog, code, payload)

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Reference code not found"
        )

    return row


@router.delete("/{catalog}/{code}")
def delete(
    catalog: str,
    code: str,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    ensure_catalog(catalog)
    deleted = delete_ref_code(db, catalog, code, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Reference code not found"
        )

    return {
        "message": "Reference code deleted successfully"
    }
