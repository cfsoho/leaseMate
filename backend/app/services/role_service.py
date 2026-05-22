from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.role import Role
from app.db.models.enums.role_code import RoleCode
from app.db.schemas.role import RoleCreate, RoleUpdate


def create_role(db: Session, payload: RoleCreate) -> Role:
    role = Role(**payload.model_dump())

    db.add(role)
    db.commit()
    db.refresh(role)

    return role

def get_role(db: Session, role_id: UUID) -> Optional[Role]:
    return db.query(Role).filter(Role.id == role_id).first()


def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Role).offset(skip).limit(limit).all()


def update_role(
    db: Session,
    role_id: UUID,
    payload: RoleUpdate
) -> Optional[Role]:
    role = get_role(db, role_id)

    if not role:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(role, field, value)

    db.commit()
    db.refresh(role)

    return role


def delete_role(db: Session, role_id: UUID) -> bool:
    role = get_role(db, role_id)

    if not role:
        return False

    db.delete(role)
    db.commit()

    return True

def seed_roles_from_enum(
    db: Session
) -> None:
    for role_code in RoleCode:
        existing = (
            db.query(Role)
            .filter(Role.code == role_code)
            .first()
        )

        if existing:
            continue

        db.add(
            Role(
                code=role_code
            )
        )

    db.commit()