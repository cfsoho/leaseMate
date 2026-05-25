import json
from pathlib import Path

import pycountry
import phonenumbers
from babel import Locale, localedata
from babel.core import get_global
from babel.numbers import get_territory_currencies
from phonenumbers import PhoneNumberFormat, PhoneNumberType
from app.db.database import SessionLocal
from app.services.ref.locale_service import upsert_locales_from_list
from app.services.ref.country_service import upsert_countries_from_list
from app.services.ref.role_service import seed_roles_from_enum
from app.services.ref.property_access_level_service import (
    upsert_property_access_levels_from_list
)
from app.services.ref.utility_type_service import upsert_utility_types_from_list
from app.services.ref.expense_type_service import (
    upsert_expense_types_from_list
)
from app.services.ref.document_type_service import upsert_document_types_from_list
from app.services.ref.contractor_type_service import upsert_contractor_types_from_list
from app.services.ref.financial_institution_service import (
    upsert_financial_institutions_from_list
)
from app.services.ref.financial_institution_branch_service import (
    upsert_financial_institution_branches_from_list
)
from app.services.ref.ref_code_service import upsert_ref_codes
from app.services.ref.status_code_service import upsert_status_codes_from_list


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


def load_json(file_name: str):
    with (DATA_DIR / file_name).open("r", encoding="utf-8") as file:
        return json.load(file)


def to_bcp47(code: str) -> str:
    return code.replace("_", "-")


def to_babel(code: str) -> str:
    return code.replace("-", "_")


def build_all_locales() -> list[dict]:
    locales = []

    for index, locale_code in enumerate(sorted(localedata.locale_identifiers()), start=1):
        try:
            locale = Locale.parse(locale_code)
            english_name = locale.get_display_name("en")
            native_name = locale.get_display_name(locale)
        except Exception:
            continue

        code = to_bcp47(locale_code)
        english_name = english_name or code
        native_name = native_name or english_name

        locales.append({
            "code": code,
            "name": english_name,
            "native_name": native_name,
            "is_active": code in {"en", "zh-TW", "zh-HK", "th", "ja"},
            "sort_order": index,
            "is_default": code == "en",
        })

    return locales


def get_default_locale_code(alpha2: str) -> str | None:
    territory_languages = get_global("territory_languages")
    languages = territory_languages.get(alpha2, {})

    if not languages:
        return None

    ranked = sorted(
        languages.items(),
        key=lambda item: (
            item[1].get("official_status") in {"official", "de_facto_official"},
            item[1].get("population_percent", 0),
        ),
        reverse=True,
    )

    for language_code, _details in ranked:
        candidates = (
            f"{language_code}_{alpha2}",
            language_code,
        )

        for candidate in candidates:
            if localedata.exists(candidate):
                return to_bcp47(candidate)

    return None


def get_country_native_name(alpha2: str, default_locale_code: str | None, fallback: str) -> str:
    if not default_locale_code:
        return fallback

    try:
        locale = Locale.parse(to_babel(default_locale_code))
        return locale.territories.get(alpha2, fallback)
    except Exception:
        return fallback


def get_country_currency_code(alpha2: str) -> str:
    currencies = get_territory_currencies(
        alpha2,
        tender=True,
        non_tender=False,
    )

    if not currencies:
        return "XXX"

    return currencies[0]


def get_phone_prefix(alpha2: str) -> str | None:
    country_code = phonenumbers.country_code_for_region(alpha2)

    if not country_code:
        return None

    return f"+{country_code}"


def get_phone_format(alpha2: str, phone_type: PhoneNumberType) -> str | None:
    example = phonenumbers.example_number_for_type(alpha2, phone_type)

    if not example:
        return None

    formatted = phonenumbers.format_number(
        example,
        PhoneNumberFormat.NATIONAL,
    )

    return "".join("X" if character.isdigit() else character for character in formatted)


def build_all_countries() -> list[dict]:
    countries = []

    for country in sorted(pycountry.countries, key=lambda item: item.alpha_3):
        default_locale_code = get_default_locale_code(country.alpha_2)

        countries.append({
            "code": country.alpha_3,
            "alpha2": country.alpha_2,
            "name": country.name,
            "native_name": get_country_native_name(
                country.alpha_2,
                default_locale_code,
                country.name,
            ),
            "phone_prefix": get_phone_prefix(country.alpha_2),
            "mobile_phone_format": get_phone_format(
                country.alpha_2,
                PhoneNumberType.MOBILE,
            ),
            "landline_phone_format": get_phone_format(
                country.alpha_2,
                PhoneNumberType.FIXED_LINE,
            ),
            "region": None,
            "currency_code": get_country_currency_code(country.alpha_2),
            "default_locale_code": default_locale_code,
        })

    return countries


def seed_master_data() -> None:
    db = SessionLocal()

    try:
        print(f'{"=" * 5} SEEDING BEGINS {"=" * 5}')

        locales = build_all_locales()
        upsert_locales_from_list(db, locales)
        print(f"{len(locales)} locales seeded into database.")

        countries = build_all_countries()
        upsert_countries_from_list(db, countries)
        print(f"{len(countries)} countries seeded into database.")

        ref_codes = load_json("ref_codes.json")
        for table_name, rows in ref_codes.items():
            upsert_ref_codes(
                db,
                table_name.replace("_", "-"),
                rows
            )
            print(f"{len(rows)} {table_name} seeded into database.")
        
        seed_roles_from_enum(db)
        print("System roles seeded into database.")

        status_codes = load_json("status_codes.json")
        upsert_status_codes_from_list(db, status_codes)
        print(f"{len(status_codes)} status code groups seeded into database.")

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

        financial_institutions = load_json("financial_institutions.json")
        upsert_financial_institutions_from_list(db, financial_institutions)
        print(f"{len(financial_institutions)} financial institutions seeded into database.")

        financial_institution_branches = (
            upsert_financial_institution_branches_from_list(
                db,
                financial_institutions
            )
        )
        print(
            f"{len(financial_institution_branches)} financial institution "
            "branches seeded into database."
        )

        print(f'{"=" * 5} SEEDING ENDS {"=" * 5}')

    except Exception as e:
        print("ERROR", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_master_data()
