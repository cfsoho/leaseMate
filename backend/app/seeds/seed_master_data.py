import json
from pathlib import Path

from app.db.database import SessionLocal
from app.services.locale_service import upsert_locales_from_list
from app.services.country_service import upsert_countries_from_list
from app.services.role_service import seed_roles_from_enum
from app.services.property_access_level_service import (
    upsert_property_access_levels_from_list
)
from app.services.utility_type_service import upsert_utility_types_from_list
from app.services.expense_type_service import (
    upsert_expense_types_from_list
)
from app.services.document_type_service import upsert_document_types_from_list
from app.services.contractor_type_service import upsert_contractor_types_from_list


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


def load_json(file_name: str):
    with (DATA_DIR / file_name).open("r", encoding="utf-8") as file:
        return json.load(file)


def extract_locales_from_countries(countries: list[dict]) -> list[dict]:
    locale_map = {}

    for country in countries:
        locale = country.get("locale")

        if not locale:
            continue

        locale_map[locale["code"]] = locale

    return list(locale_map.values())


def normalize_countries(countries: list[dict]) -> list[dict]:
    normalized = []

    for country in countries:
        item = country.copy()
        locale = item.pop("locale", None)

        if locale:
            item["default_locale_code"] = locale["code"]

        normalized.append(item)

    return normalized


def seed_master_data() -> None:
    db = SessionLocal()

    try:
        print(f'{"=" * 5} SEEDING BEGINS {"=" * 5}')

        countries_raw = load_json("countries.json")

        locales = extract_locales_from_countries(countries_raw)
        upsert_locales_from_list(db, locales)
        print(f"{len(locales)} locales seeded into database.")

        countries = normalize_countries(countries_raw)
        upsert_countries_from_list(db, countries)
        print(f"{len(countries)} countries seeded into database.")
        
        seed_roles_from_enum(db)
        print("System roles seeded into database.")

        property_access_levels = load_json("property_access_levels.json")
        upsert_property_access_levels_from_list(db, property_access_levels)
        print(f"{len(property_access_levels)} property access level groups seeded into database.")

        utility_types = load_json("utility_types.json")
        upsert_utility_types_from_list(db, utility_types)
        print(f"{len(utility_types)} utility type groups seeded into database.")

        expense_types = load_json("expense_types.json")
        upsert_expense_types_from_list(db, expense_types)
        print(f"{len(expense_types)} expense type groups seeded into database.")

        document_types = load_json("document_types.json")
        upsert_document_types_from_list(db, document_types)
        print(f"{len(document_types)} document type groups seeded into database.")
        
        contractor_types = load_json("contractor_types.json")
        upsert_contractor_types_from_list(db, contractor_types)
        print(f"{len(contractor_types)} contractor type groups seeded into database.")

        print(f'{"=" * 5} SEEDING ENDS {"=" * 5}')

    except Exception as e:
        print("ERROR", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_master_data()