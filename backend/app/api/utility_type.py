from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.utility_type import (
    UtilityTypeCreate,
    UtilityTypeUpdate,
    UtilityTypeRead,
)
from app.services.utility_type_service import (
    create_utility_type,
    get_utility_type,
    get_utility_types,
    update_utility_type,
    delete_utility_type,
)

router = APIRouter(
    prefix="/utility-types",
    tags=["Utility Types"]
)


@router.post("", response_model=UtilityTypeRead)
def create(
    payload: UtilityTypeCreate,
    db: Session = Depends(get_db)
):
    return create_utility_type(db, payload)


@router.get("", response_model=List[UtilityTypeRead])
def list_all(
    locale: str = "en",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_utility_types(db, locale, skip, limit)


@router.get("/{utility_type_id}/{locale}", response_model=UtilityTypeRead)
def get_one(
    utility_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    utility_type = get_utility_type(db, utility_type_id, locale)

    if not utility_type:
        raise HTTPException(
            status_code=404,
            detail="Utility type not found"
        )

    return utility_type


@router.put("/{utility_type_id}/{locale}", response_model=UtilityTypeRead)
def update(
    utility_type_id: UUID,
    locale: str,
    payload: UtilityTypeUpdate,
    db: Session = Depends(get_db)
):
    utility_type = update_utility_type(
        db,
        utility_type_id,
        locale,
        payload
    )

    if not utility_type:
        raise HTTPException(
            status_code=404,
            detail="Utility type not found"
        )

    return utility_type


@router.delete("/{utility_type_id}/{locale}")
def delete(
    utility_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):
    deleted = delete_utility_type(db, utility_type_id, locale)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Utility type not found"
        )

    return {
        "message": "Utility type deleted successfully"
    }