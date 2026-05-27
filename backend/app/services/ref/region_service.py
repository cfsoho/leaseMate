from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.ref.region import Region
from app.db.schemas.ref.region import RegionCreate, RegionUpdate
from app.services.soft_delete import soft_delete


def create_region(db: Session, payload: RegionCreate) -> Region:
    region = Region(**payload.model_dump())

    db.add(region)
    db.commit()
    db.refresh(region)

    return region


def get_region(db: Session, region_id: UUID) -> Optional[Region]:
    return db.query(Region).filter(Region.id == region_id).first()


def get_region_by_code(db: Session, code: str) -> Optional[Region]:
    return db.query(Region).filter(Region.code == code).first()


def get_regions(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Region)
        .order_by(Region.is_active.desc(), Region.sort_order, Region.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_region(
    db: Session,
    region_id: UUID,
    payload: RegionUpdate,
) -> Optional[Region]:
    region = get_region(db, region_id)

    if not region:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(region, field, value)

    db.commit()
    db.refresh(region)

    return region


def delete_region(
    db: Session,
    region_id: UUID,
    deleted_by: Optional[UUID] = None,
) -> bool:
    region = get_region(db, region_id)

    if not region:
        return False

    soft_delete(db, region, deleted_by)

    return True


def upsert_regions_from_list(db: Session, regions: list[dict]) -> None:
    for item in regions:
        payload = RegionCreate(**item)
        data = payload.model_dump()
        region = get_region_by_code(db, data["code"])

        if region:
            for field, value in data.items():
                setattr(region, field, value)
        else:
            db.add(Region(**data))

    db.commit()
