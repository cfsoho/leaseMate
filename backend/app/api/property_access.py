from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.property_access import (
    PropertyAccessCreate,
    PropertyAccessUpdate,
    PropertyAccessRead,
)
from app.services.property_access_service import (
    create_property_access,
    get_property_access,
    get_property_access_list,
    update_property_access,
    delete_property_access,
)

router = APIRouter(
    prefix="/property-access",
    tags=["Property Access"]
)


@router.post("", response_model=PropertyAccessRead)
def create(
    payload: PropertyAccessCreate,
    db: Session = Depends(get_db)
):
    return create_property_access(db, payload)


@router.get("", response_model=List[PropertyAccessRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_property_access_list(db, skip, limit)


@router.get("/{property_access_id}", response_model=PropertyAccessRead)
def get_one(
    property_access_id: UUID,
    db: Session = Depends(get_db)
):
    access = get_property_access(db, property_access_id)

    if not access:
        raise HTTPException(
            status_code=404,
            detail="Property access not found"
        )

    return access


@router.put("/{property_access_id}", response_model=PropertyAccessRead)
def update(
    property_access_id: UUID,
    payload: PropertyAccessUpdate,
    db: Session = Depends(get_db)
):
    access = update_property_access(db, property_access_id, payload)

    if not access:
        raise HTTPException(
            status_code=404,
            detail="Property access not found"
        )

    return access


@router.delete("/{property_access_id}")
def delete(
    property_access_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_property_access(db, property_access_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Property access not found"
        )

    return {
        "message": "Property access deleted successfully"
    }