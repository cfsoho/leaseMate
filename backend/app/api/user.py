from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.user import (
    UserCreate,
    UserUpdate,
    UserRead,
)
from app.services.user_service import (
    create_user,
    get_user,
    get_users,
    update_user,
    delete_user,
)
from app.services.user_auth_service import deactivate_user


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("", response_model=UserRead)
def create(
    payload: UserCreate,
    db: Session = Depends(get_db)
):
    return create_user(db, payload)


@router.get("", response_model=List[UserRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_users(db, skip, limit)


@router.get("/{user_id}", response_model=UserRead)
def get_one(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    user = get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/{user_id}", response_model=UserRead)
def update(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db)
):
    user = update_user(db, user_id, payload)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.patch("/{user_id}/deactivate", response_model=UserRead)
def deactivate(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    user = deactivate_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.delete("/{user_id}")
def delete(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    deleted = delete_user(db, user_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "User deleted successfully"
    }