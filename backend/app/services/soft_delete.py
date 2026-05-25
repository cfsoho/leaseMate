from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session


def soft_delete(db: Session, row, deleted_by: Optional[UUID] = None) -> None:
    row.is_deleted = True
    row.deleted_at = datetime.now(timezone.utc)
    row.deleted_by = deleted_by
    db.commit()
