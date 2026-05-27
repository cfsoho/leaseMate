from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.property_access_level import (
    PropertyAccessLevelCreate,
    PropertyAccessLevelUpdate,
    PropertyAccessLevelRead,
)
from app.services.ref.property_access_level_service import (
    create_property_access_level,
    get_property_access_level,
    get_property_access_levels,
    update_property_access_level,
    delete_property_access_level,
)

router = APIRouter(
    prefix="/property-access-levels",
    tags=["Property Access Levels"],
    dependencies=[Depends(require_admin)]
)


@router.post("", response_model=PropertyAccessLevelRead)
def create(
    payload: PropertyAccessLevelCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        return create_property_access_level(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=List[PropertyAccessLevelRead])
def list_all(
    locale: str = "en",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_property_access_levels(db, locale, skip, limit)


@router.get("/{access_level_id}/{locale}", response_model=PropertyAccessLevelRead)
def get_one(
    access_level_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    access_level = get_property_access_level(db, access_level_id, locale)

    if not access_level:
        raise HTTPException(
            status_code=404,
            detail="Property access level not found"
        )

    return access_level


@router.put("/{access_level_id}/{locale}", response_model=PropertyAccessLevelRead)
def update(
    access_level_id: UUID,
    locale: str,
    payload: PropertyAccessLevelUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        access_level = update_property_access_level(
            db,
            access_level_id,
            locale,
            payload
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if not access_level:
        raise HTTPException(
            status_code=404,
            detail="Property access level not found"
        )

    return access_level


@router.delete("/{access_level_id}/{locale}")
def delete(
    access_level_id: UUID,
    locale: str,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_property_access_level(db, access_level_id, locale, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Property access level not found"
        )

    return {
        "message": "Property access level deleted successfully"
    }
