from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.property import Property
from app.db.schemas.property import PropertyCreate, PropertyUpdate

from app.services.soft_delete import soft_delete

def create_property(db: Session, payload: PropertyCreate) -> Property:
    property_obj = Property(**payload.model_dump())

    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)

    return property_obj


def get_property(db: Session, property_id: UUID) -> Optional[Property]:
    return (
        db.query(Property)
        .filter(Property.id == property_id)
        .first()
    )


def get_properties(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Property)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_property(
    db: Session,
    property_id: UUID,
    payload: PropertyUpdate
) -> Optional[Property]:
    property_obj = get_property(db, property_id)

    if not property_obj:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(property_obj, field, value)

    db.commit()
    db.refresh(property_obj)

    return property_obj


def delete_property(db: Session, property_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    property_obj = get_property(db, property_id)

    if not property_obj:
        return False
    soft_delete(db, property_obj, deleted_by)

    return True