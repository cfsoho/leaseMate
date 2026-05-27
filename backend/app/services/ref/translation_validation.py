from typing import Optional, Type
from uuid import UUID

from sqlalchemy.orm import Session


def ensure_translation_locale_available(
    db: Session,
    model: Type,
    shared_id: UUID,
    locale: str,
    current_locale: Optional[str] = None,
) -> None:
    if not locale or locale == current_locale:
        return

    existing = (
        db.query(model)
        .filter(
            model.id == shared_id,
            model.locale == locale,
        )
        .first()
    )

    if existing:
        raise ValueError(f"Translation already exists for locale {locale}.")
