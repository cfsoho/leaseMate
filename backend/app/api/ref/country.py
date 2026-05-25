from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.country import (
    CountryCreate,
    CountryUpdate,
    CountryRead,
)
from app.services.ref.country_service import (
    create_country,
    get_country,
    get_country_by_code,
    get_countries,
    update_country,
    delete_country,
)

router = APIRouter(
    prefix="/countries",
    tags=["Countries"],
    dependencies=[Depends(require_admin)]
)


@router.post("", response_model=CountryRead)
def create(
    payload: CountryCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = get_country_by_code(db, payload.code)

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Country code already exists"
        )

    return create_country(db, payload)

@router.post("/bulk", response_model=List[CountryRead])
def create_bulk(
    payload: List[CountryCreate],
    db: Session = Depends(get_db)
):
    created_countries = []

    for item in payload:
        existing = get_country_by_code(db, item.code)

        if existing:
            created_countries.append(existing)
            continue

        country = create_country(db, item)
        created_countries.append(country)

    return created_countries


@router.get("", response_model=List[CountryRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_countries(db, skip, limit)


@router.get("/{country_id}", response_model=CountryRead)
def get_one(
    country_id: UUID,
    db: Session = Depends(get_db)
):
    country = get_country(db, country_id)

    if not country:
        raise HTTPException(
            status_code=404,
            detail="Country not found"
        )

    return country


@router.put("/{country_id}", response_model=CountryRead)
def update(
    country_id: UUID,
    payload: CountryUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    country = update_country(
        db,
        country_id,
        payload
    )

    if not country:
        raise HTTPException(
            status_code=404,
            detail="Country not found"
        )

    return country


@router.delete("/{country_id}")
def delete(
    country_id: UUID,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_country(db, country_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Country not found"
        )

    return {
        "message": "Country deleted successfully"
    }