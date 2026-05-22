from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.locale import (
    LocaleCreate,
    LocaleUpdate,
    LocaleRead,
)
from app.services.locale_service import (
    create_locale,
    get_locale,
    get_locales,
    update_locale,
    delete_locale,
)

router = APIRouter(
    prefix="/locales",
    tags=["Locales"]
)


@router.post("", response_model=LocaleRead)
def create(
    payload: LocaleCreate,
    db: Session = Depends(get_db)
):
    return create_locale(db, payload)


@router.get("", response_model=List[LocaleRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_locales(db, skip, limit)


@router.get("/{code}", response_model=LocaleRead)
def get_one(
    code: str,
    db: Session = Depends(get_db)
):
    locale = get_locale(db, code)

    if not locale:
        raise HTTPException(
            status_code=404,
            detail="Locale not found"
        )

    return locale


@router.put("/{code}", response_model=LocaleRead)
def update(
    code: str,
    payload: LocaleUpdate,
    db: Session = Depends(get_db)
):
    locale = update_locale(db, code, payload)

    if not locale:
        raise HTTPException(
            status_code=404,
            detail="Locale not found"
        )

    return locale


@router.delete("/{code}")
def delete(
    code: str,
    db: Session = Depends(get_db)
):
    deleted = delete_locale(db, code)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Locale not found"
        )

    return {
        "message": "Locale deleted successfully"
    }