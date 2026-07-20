from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.user_legal_name import (
    UserLegalNameCreate,
    UserLegalNameUpdate,
    UserLegalNameRead,
)
from app.services.user_legal_name_service import (
    create_user_legal_name,
    get_user_legal_name,
    get_user_legal_names,
    update_user_legal_name,
    delete_user_legal_name,
)

router = APIRouter(
    prefix="/user-legal-names",
    tags=["User Legal Names"],
    dependencies=[Depends(require_current_user)]
)


@router.post("", response_model=UserLegalNameRead)
def create(
    payload: UserLegalNameCreate,
    db: Session = Depends(get_db)
):
    try:
        return create_user_legal_name(db, payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("", response_model=List[UserLegalNameRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    return get_user_legal_names(db, skip, limit, user_id)


@router.get("/{legal_name_id}", response_model=UserLegalNameRead)
def get_one(
    legal_name_id: UUID,
    db: Session = Depends(get_db)
):
    legal_name = get_user_legal_name(db, legal_name_id)

    if not legal_name:
        raise HTTPException(
            status_code=404,
            detail="User legal name not found"
        )

    return legal_name


@router.put("/{legal_name_id}", response_model=UserLegalNameRead)
def update(
    legal_name_id: UUID,
    payload: UserLegalNameUpdate,
    db: Session = Depends(get_db)
):
    try:
        legal_name = update_user_legal_name(db, legal_name_id, payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if not legal_name:
        raise HTTPException(
            status_code=404,
            detail="User legal name not found"
        )

    return legal_name


@router.delete("/{legal_name_id}")
def delete(
    legal_name_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_user_legal_name(db, legal_name_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="User legal name not found"
        )

    return {
        "message": "User legal name deleted successfully"
    }
