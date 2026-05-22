from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyRead,
)
from app.services.property_service import (
    create_property,
    get_property,
    get_properties,
    update_property,
    delete_property,
)

router = APIRouter(
    prefix="/properties",
    tags=["Properties"]
)


@router.post("", response_model=PropertyRead)
def create(
    payload: PropertyCreate,
    db: Session = Depends(get_db)
):
    return create_property(db, payload)


@router.get("", response_model=List[PropertyRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_properties(db, skip, limit)


@router.get("/{property_id}", response_model=PropertyRead)
def get_one(
    property_id: UUID,
    db: Session = Depends(get_db)
):
    property_obj = get_property(db, property_id)

    if not property_obj:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    return property_obj


@router.put("/{property_id}", response_model=PropertyRead)
def update(
    property_id: UUID,
    payload: PropertyUpdate,
    db: Session = Depends(get_db)
):
    property_obj = update_property(db, property_id, payload)

    if not property_obj:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    return property_obj


@router.delete("/{property_id}")
def delete(
    property_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_property(db, property_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    return {
        "message": "Property deleted successfully"
    }