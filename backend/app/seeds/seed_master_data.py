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
from app.services.ref.region_service import upsert_regions_from_list
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

REGION_SEEDS = [
    {
        "id": "11111111-2222-4000-8000-000000000001",
        "code": "AFRICA",
        "name": "Africa",
        "description": "Countries and territories in Africa.",
        "sort_order": 10,
    },
    {
        "id": "11111111-2222-4000-8000-000000000002",
        "code": "AMERICAS",
        "name": "Americas",
        "description": "Countries and territories in North, Central, South America, and the Caribbean.",
        "sort_order": 20,
    },
    {
        "id": "11111111-2222-4000-8000-000000000003",
        "code": "ANTARCTICA",
        "name": "Antarctica",
        "description": "Antarctic countries and territories.",
        "sort_order": 30,
    },
    {
        "id": "11111111-2222-4000-8000-000000000004",
        "code": "ASIA",
        "name": "Asia",
        "description": "Countries and territories in Asia.",
        "sort_order": 40,
    },
    {
        "id": "11111111-2222-4000-8000-000000000005",
        "code": "EUROPE",
        "name": "Europe",
        "description": "Countries and territories in Europe.",
        "sort_order": 50,
    },
    {
        "id": "11111111-2222-4000-8000-000000000006",
        "code": "OCEANIA",
        "name": "Oceania",
        "description": "Countries and territories in Oceania.",
        "sort_order": 60,
    },
]

REGION_ID_BY_NAME = {
    region["name"]: region["id"]
    for region in REGION_SEEDS
}

REGION_ALPHA2_CODES = {
    REGION_ID_BY_NAME["Africa"]: {
        "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV",
        "DJ", "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ",
        "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU",
        "MW", "MZ", "NA", "NE", "NG", "RE", "RW", "SC", "SD", "SH", "SL",
        "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG", "YT",
        "ZA", "ZM", "ZW",
    },
    REGION_ID_BY_NAME["Americas"]: {
        "AG", "AI", "AR", "AW", "BB", "BL", "BM", "BO", "BQ", "BR", "BS",
        "BZ", "CA", "CL", "CO", "CR", "CU", "CW", "DM", "DO", "EC", "FK",
        "GD", "GF", "GL", "GP", "GT", "GY", "HN", "HT", "JM", "KN", "KY",
        "LC", "MF", "MQ", "MS", "MX", "NI", "PA", "PE", "PM", "PR", "PY",
        "SR", "SV", "SX", "TC", "TT", "US", "UY", "VC", "VE", "VG", "VI",
    },
    REGION_ID_BY_NAME["Antarctica"]: {
        "AQ", "BV", "GS", "HM", "TF",
    },
    REGION_ID_BY_NAME["Asia"]: {
        "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CC", "CN", "CX",
        "CY", "GE", "HK", "ID", "IL", "IN", "IO", "IQ", "IR", "JO", "JP",
        "KG", "KH", "KP", "KR", "KW", "KZ", "LA", "LB", "LK", "MM", "MN",
        "MO", "MV", "MY", "NP", "OM", "PH", "PK", "PS", "QA", "SA", "SG",
        "SY", "TH", "TJ", "TL", "TM", "TR", "TW", "UZ", "VN", "YE",
    },
    REGION_ID_BY_NAME["Europe"]: {
        "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CZ", "DE",
        "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR",
        "HU", "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC",
        "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU",
        "SE", "SI", "SJ", "SK", "SM", "UA", "VA",
    },
    REGION_ID_BY_NAME["Oceania"]: {
        "AS", "AU", "CK", "FJ", "FM", "GU", "KI", "MH", "MP", "NC", "NF",
        "NR", "NU", "NZ", "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV",
        "UM", "VU", "WF", "WS",
    },
}

REGION_BY_ALPHA2 = {
    alpha2: region_id
    for region_id, alpha2_codes in REGION_ALPHA2_CODES.items()
    for alpha2 in alpha2_codes
}


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
            "name_order": get_name_order(code),
            "name_format_mask": get_name_format_mask(code),
            "is_active": code in {"en", "zh-Hant-TW", "zh-Hant-HK", "th", "ja"},
            "sort_order": index,
            "is_default": code == "en",
        })

    return locales


def get_name_order(code: str) -> str:
    language = code.split("-")[0]
    return "FAMILY_GIVEN" if language in {"ja", "ko", "zh"} else "GIVEN_FAMILY"


def get_name_format_mask(code: str) -> str:
    return (
        "{family_name}{given_name}"
        if get_name_order(code) == "FAMILY_GIVEN"
        else "{given_name} {family_name}"
    )


def get_default_locale_code(alpha2: str) -> str | None:
    supported_locale_by_territory = {
        "HK": "zh-Hant-HK",
        "JP": "ja",
        "TH": "th",
        "TW": "zh-Hant-TW",
        "US": "en",
    }

    if alpha2 in supported_locale_by_territory:
        return supported_locale_by_territory[alpha2]

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


def get_country_region_id(alpha2: str) -> str | None:
    return REGION_BY_ALPHA2.get(alpha2)


def build_all_countries() -> list[dict]:
    countries = []

    for country in sorted(pycountry.countries, key=lambda item: item.alpha_3):
        default_locale_code = get_default_locale_code(country.alpha_2)
        display_name = getattr(country, "common_name", country.name)

        countries.append({
            "code": country.alpha_3,
            "alpha2": country.alpha_2,
            "name": display_name,
            "native_name": get_country_native_name(
                country.alpha_2,
                default_locale_code,
                display_name,
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
            "region_id": get_country_region_id(country.alpha_2),
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

        upsert_regions_from_list(db, REGION_SEEDS)
        print(f"{len(REGION_SEEDS)} regions seeded into database.")

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
