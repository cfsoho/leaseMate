from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.locale import Locale
from app.db.schemas.ref.locale import LocaleCreate, LocaleUpdate

from app.services.soft_delete import soft_delete

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


def delete_locale(db: Session, code: str,
    deleted_by: Optional[UUID] = None) -> bool:
    locale = get_locale(db, code)

    if not locale:
        return False
    soft_delete(db, locale, deleted_by)

    return True

def upsert_locales_from_list(
    db,
    locales: list[dict]
) -> None:
    for item in locales:
        locale = (
            db.query(Locale)
            .filter(Locale.code == item["code"])
            .first()
        )

        if locale:
            locale.name = item["name"]
            locale.native_name = item.get("native_name")
            locale.is_active = item.get("is_active", True)
            locale.sort_order = item.get("sort_order", 0)
            locale.is_default = item.get("is_default", False)
        else:
            db.add(Locale(**item))

    db.commit()