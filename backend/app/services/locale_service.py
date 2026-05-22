from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.locale import Locale
from app.db.schemas.locale import LocaleCreate, LocaleUpdate


def create_locale(db: Session, payload: LocaleCreate) -> Locale:
    locale = Locale(**payload.model_dump())

    db.add(locale)
    db.commit()
    db.refresh(locale)

    return locale


def get_locale(db: Session, code: str) -> Optional[Locale]:
    return (
        db.query(Locale)
        .filter(Locale.code == code)
        .first()
    )


def get_locales(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Locale)
        .order_by(Locale.sort_order, Locale.code)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_locale(
    db: Session,
    code: str,
    payload: LocaleUpdate
) -> Optional[Locale]:
    locale = get_locale(db, code)

    if not locale:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(locale, field, value)

    db.commit()
    db.refresh(locale)

    return locale


def delete_locale(db: Session, code: str) -> bool:
    locale = get_locale(db, code)

    if not locale:
        return False

    db.delete(locale)
    db.commit()

    return True