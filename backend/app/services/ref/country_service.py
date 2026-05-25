from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.country import Country
from app.db.schemas.ref.country import CountryCreate, CountryUpdate

from app.services.soft_delete import soft_delete

def create_country(
    db: Session,
    payload: CountryCreate
) -> Country:
    country = Country(**payload.model_dump())

    db.add(country)
    db.commit()
    db.refresh(country)

    return country


def get_country(
    db: Session,
    country_id: UUID
) -> Optional[Country]:
    return (
        db.query(Country)
        .filter(Country.id == country_id)
        .first()
    )


def get_country_by_code(
    db: Session,
    code: str
) -> Optional[Country]:
    return (
        db.query(Country)
        .filter(Country.code == code)
        .first()
    )


def get_countries(
    db: Session,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Country)
        .order_by(Country.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_country(
    db: Session,
    country_id: UUID,
    payload: CountryUpdate
) -> Optional[Country]:
    country = get_country(db, country_id)

    if not country:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(country, field, value)

    db.commit()
    db.refresh(country)

    return country


def delete_country(
    db: Session,
    country_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    country = get_country(db, country_id)

    if not country:
        return False
    soft_delete(db, country, deleted_by)

    return True


def upsert_countries_from_list(
    db: Session,
    countries: list[dict]
) -> None:
    for item in countries:
        payload = CountryCreate(**item)
        data = payload.model_dump()
        country = get_country_by_code(db, data["code"])

        if country:
            for field, value in data.items():
                setattr(country, field, value)
        else:
            db.add(Country(**data))

    db.commit()
