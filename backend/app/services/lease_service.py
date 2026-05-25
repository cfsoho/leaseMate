from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.lease import Lease
from app.db.schemas.lease import LeaseCreate, LeaseUpdate

from app.services.soft_delete import soft_delete

def create_lease(db: Session, payload: LeaseCreate) -> Lease:
    lease = Lease(**payload.model_dump())

    db.add(lease)
    db.commit()
    db.refresh(lease)

    return lease


def get_lease(db: Session, lease_id: UUID) -> Optional[Lease]:
    return (
        db.query(Lease)
        .filter(Lease.id == lease_id)
        .first()
    )


def get_leases(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Lease)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_lease(
    db: Session,
    lease_id: UUID,
    payload: LeaseUpdate
) -> Optional[Lease]:
    lease = get_lease(db, lease_id)

    if not lease:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(lease, field, value)

    db.commit()
    db.refresh(lease)

    return lease


def delete_lease(db: Session, lease_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    lease = get_lease(db, lease_id)

    if not lease:
        return False
    soft_delete(db, lease, deleted_by)

    return True