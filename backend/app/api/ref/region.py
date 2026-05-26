from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.database import get_db
from app.db.schemas.ref.region import RegionCreate, RegionRead, RegionUpdate
from app.services.ref.region_service import (
    create_region,
    delete_region,
    get_region,
    get_region_by_code,
    get_regions,
    update_region,
)

router = APIRouter(
    prefix="/regions",
    tags=["Regions"],
    dependencies=[Depends(require_admin)],
)


@router.post("", response_model=RegionRead)
def create(
    payload: RegionCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = get_region_by_code(db, payload.code)

    if existing:
        raise HTTPException(status_code=400, detail="Region code already exists")

    return create_region(db, payload)


@router.get("", response_model=List[RegionRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return get_regions(db, skip, limit)


@router.get("/{region_id}", response_model=RegionRead)
def get_one(
    region_id: UUID,
    db: Session = Depends(get_db),
):
    region = get_region(db, region_id)

    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    return region


@router.put("/{region_id}", response_model=RegionRead)
def update(
    region_id: UUID,
    payload: RegionUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    region = update_region(db, region_id, payload)

    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    return region


@router.delete("/{region_id}")
def delete(
    region_id: UUID,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    deleted = delete_region(db, region_id, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Region not found")

    return {"message": "Region deleted successfully"}
