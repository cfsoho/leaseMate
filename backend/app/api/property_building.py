from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import require_current_user
from app.db.database import get_db
from app.db.schemas.property_building import (
    PropertyBuildingCreate,
    PropertyBuildingRead,
    PropertyBuildingUpdate,
)
from app.services.property_building_service import (
    create_property_building,
    delete_property_building,
    get_property_building,
    get_property_buildings,
    update_property_building,
)

router = APIRouter(
    prefix="/property-buildings",
    tags=["Property Buildings"],
    dependencies=[Depends(require_current_user)],
)


@router.post("", response_model=PropertyBuildingRead)
def create(
    payload: PropertyBuildingCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_property_building(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=List[PropertyBuildingRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return get_property_buildings(db, skip, limit)


@router.get("/{building_id}", response_model=PropertyBuildingRead)
def get_one(
    building_id: UUID,
    db: Session = Depends(get_db),
):
    building = get_property_building(db, building_id)

    if not building:
        raise HTTPException(status_code=404, detail="Property building not found")

    return building


@router.put("/{building_id}", response_model=PropertyBuildingRead)
def update(
    building_id: UUID,
    payload: PropertyBuildingUpdate,
    db: Session = Depends(get_db),
):
    try:
        building = update_property_building(db, building_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not building:
        raise HTTPException(status_code=404, detail="Property building not found")

    return building


@router.delete("/{building_id}")
def delete(
    building_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_property_building(db, building_id, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Property building not found")

    return {"message": "Property building deleted successfully"}
