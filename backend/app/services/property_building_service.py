from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.property_building import PropertyBuilding
from app.db.schemas.property_building import (
    PropertyBuildingCreate,
    PropertyBuildingUpdate,
)
from app.services.soft_delete import soft_delete


def _normalize_property_building_data(data: dict) -> dict:
    normalized = dict(data)

    for field_name in ("name", "address", "district", "city", "zipcode"):
        if normalized.get(field_name) is not None:
            normalized[field_name] = str(normalized[field_name]).strip()

    if not normalized.get("name"):
        raise ValueError("Building name is required.")

    if not normalized.get("country_id"):
        raise ValueError("Country is required.")

    return normalized


def create_property_building(
    db: Session,
    payload: PropertyBuildingCreate,
) -> PropertyBuilding:
    data = _normalize_property_building_data(payload.model_dump())
    building = PropertyBuilding(**data)

    db.add(building)
    db.commit()
    db.refresh(building)

    return building


def get_property_building(
    db: Session,
    building_id: UUID,
) -> Optional[PropertyBuilding]:
    return (
        db.query(PropertyBuilding)
        .filter(PropertyBuilding.id == building_id)
        .first()
    )


def get_property_buildings(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(PropertyBuilding)
        .filter(PropertyBuilding.is_deleted.is_(False))
        .order_by(
            PropertyBuilding.is_active.desc(),
            PropertyBuilding.name.asc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_property_building(
    db: Session,
    building_id: UUID,
    payload: PropertyBuildingUpdate,
) -> Optional[PropertyBuilding]:
    building = get_property_building(db, building_id)

    if not building:
        return None

    update_data = _normalize_property_building_data(
        {
            **{
                "name": building.name,
                "country_id": building.country_id,
            },
            **payload.model_dump(exclude_unset=True),
        }
    )

    for field, value in update_data.items():
        setattr(building, field, value)

    db.commit()
    db.refresh(building)

    return building


def delete_property_building(
    db: Session,
    building_id: UUID,
    deleted_by: Optional[UUID] = None,
) -> bool:
    building = get_property_building(db, building_id)

    if not building:
        return False

    soft_delete(db, building, deleted_by)

    return True
