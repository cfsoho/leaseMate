from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.db.schemas.ref.role import (
    RoleCreate,
    RoleUpdate,
    RoleRead,
)
from app.services.ref.role_service import (
    create_role,
    get_role,
    get_roles,
    update_role,
    delete_role,
)

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
    dependencies=[Depends(require_admin)]
)


@router.post("", response_model=RoleRead)
def create(
    payload: RoleCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return create_role(db, payload)


@router.get("", response_model=List[RoleRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_roles(db, skip, limit)


@router.get("/{role_id}", response_model=RoleRead)
def get_one(
    role_id: UUID,
    db: Session = Depends(get_db)
):
    role = get_role(db, role_id)

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return role


@router.put("/{role_id}", response_model=RoleRead)
def update(
    role_id: UUID,
    payload: RoleUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    role = update_role(db, role_id, payload)

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return role


@router.delete("/{role_id}")
def delete(
    role_id: UUID,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_role(db, role_id, current_user.id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return {
        "message": "Role deleted successfully"
    }