from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.country import Country
from app.db.schemas.country import CountryCreate, CountryUpdate


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
    country_id: UUID
) -> bool:
    country = get_country(db, country_id)

    if not country:
        return False

    db.delete(country)
    db.commit()

    return True


def upsert_countries_from_list(
    db: Session,
    countries: list[dict]
) -> None:
    for item in countries:
        country = get_country_by_code(db, item["code"])

        if country:
            country.alpha2 = item["alpha2"]
            country.name = item["name"]
            country.native_name = item.get("native_name")
            country.phone_prefix = item.get("phone_prefix")
            country.region = item.get("region")
            country.currency_code = item["currency_code"]
            country.default_locale_code = item.get("default_locale_code")
        else:
            db.add(Country(**item))

    db.commit()