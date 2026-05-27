from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session


TRANSLATION_OWNED_FIELDS = {"locale", "name", "description"}


def propagate_master_shared_fields(
    db: Session,
    model: Any,
    shared_id: UUID,
    locale: str,
    update_data: dict[str, Any],
    shared_fields: set[str],
) -> None:
    if locale != "en":
        return

    shared_update = {
        field: value
        for field, value in update_data.items()
        if field in shared_fields and field not in TRANSLATION_OWNED_FIELDS
    }
    if not shared_update:
        return

    (
        db.query(model)
        .filter(model.id == shared_id, model.locale != "en")
        .update(shared_update, synchronize_session=False)
    )


def inherit_master_shared_fields(
    db: Session,
    model: Any,
    data: dict[str, Any],
    shared_fields: set[str],
) -> None:
    if data.get("locale") == "en" or not data.get("id"):
        return

    master_record = (
        db.query(model)
        .filter(model.id == data["id"], model.locale == "en")
        .first()
    )
    if master_record is None:
        return

    for field in shared_fields:
        data[field] = getattr(master_record, field)
