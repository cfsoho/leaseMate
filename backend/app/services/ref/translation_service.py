import csv
import io
from datetime import date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.ref.contractor_type import ContractorType
from app.db.models.ref.document_type import DocumentType
from app.db.models.ref.expense_type import ExpenseType
from app.db.models.ref.locale import Locale
from app.db.models.ref.property_access_level import PropertyAccessLevel
from app.db.models.ref.status_code import StatusCode
from app.db.models.ref.utility_type import UtilityType


LOCALIZED_MODELS = {
    "contractor-types": ContractorType,
    "document-types": DocumentType,
    "expense-types": ExpenseType,
    "property-access-levels": PropertyAccessLevel,
    "status-codes": StatusCode,
    "utility-types": UtilityType,
}

TRANSLATION_FIELDS = ["locale", "name", "description", "is_active"]


def get_translation_model(slug: str):
    return LOCALIZED_MODELS.get(slug)


def normalize_translation_locale(locale: str) -> str:
    aliases = {
        "zh-Hant-HK": "zh-HK",
        "zh-Hant-TW": "zh-TW",
    }
    return aliases.get(locale, locale)


def get_translation_rows(db: Session, slug: str, shared_id: UUID):
    model = get_translation_model(slug)
    if model is None:
        return []

    return (
        db.query(model)
        .filter(model.id == shared_id, model.locale != "en")
        .order_by(model.locale)
        .all()
    )


def build_translation_template_csv(db: Session, slug: str, shared_id: UUID) -> str:
    model = get_translation_model(slug)
    if model is None:
        return ""

    master_record = (
        db.query(model)
        .filter(model.id == shared_id, model.locale == "en")
        .first()
    )
    if master_record is None:
        return ""

    existing_locales = {
        normalize_translation_locale(row.locale)
        for row in db.query(model.locale).filter(model.id == shared_id).all()
    }
    locale_rows = (
        db.query(Locale)
        .order_by(Locale.sort_order, Locale.code)
        .all()
    )

    template_rows = [
        _build_template_row("en", master_record),
        *[
            _build_template_row(normalize_translation_locale(locale.code), None)
            for locale in locale_rows
            if normalize_translation_locale(locale.code) != "en"
            and normalize_translation_locale(locale.code) not in existing_locales
        ],
    ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(TRANSLATION_FIELDS)
    writer.writerows(template_rows)
    return output.getvalue()


def upload_translation_rows(
    db: Session,
    slug: str,
    shared_id: UUID,
    rows: list[dict[str, Any]],
) -> dict[str, list[str]]:
    model = get_translation_model(slug)
    if model is None:
        return {"inserted_locales": [], "skipped_locales": []}

    master_record = (
        db.query(model)
        .filter(model.id == shared_id, model.locale == "en")
        .first()
    )
    if master_record is None:
        return {"inserted_locales": [], "skipped_locales": []}

    existing_locales = {
        normalize_translation_locale(row.locale)
        for row in db.query(model.locale).filter(model.id == shared_id).all()
    }
    inserted_locales: list[str] = []
    skipped_locales: list[str] = []

    for row in rows:
        if not any(str(value).strip() for value in row.values()):
            continue

        locale = normalize_translation_locale(str(row.get("locale", "")).strip())
        if not locale or locale == "en":
            continue

        if not _has_required_translation_values(row):
            continue

        if locale in existing_locales:
            skipped_locales.append(locale)
            continue

        db.add(
            model(
                **_build_insert_payload(model, master_record, row, locale)
            )
        )
        existing_locales.add(locale)
        inserted_locales.append(locale)

    db.commit()
    return {
        "inserted_locales": inserted_locales,
        "skipped_locales": skipped_locales,
    }


def serialize_translation_row(row: Any) -> dict[str, Any]:
    return {
        column.name: _serialize_value(getattr(row, column.name))
        for column in row.__table__.columns
    }


def _build_template_row(locale: str, master_record: Any | None) -> list[str]:
    return [
        locale,
        "" if master_record is None else str(master_record.name or ""),
        "" if master_record is None else str(master_record.description or ""),
        "true" if master_record is not None else "",
    ]


def _build_insert_payload(
    model: Any,
    master_record: Any,
    row: dict[str, Any],
    locale: str,
) -> dict[str, Any]:
    payload = {
        "id": master_record.id,
        "locale": locale,
        "name": str(row.get("name", "")).strip(),
        "description": str(row.get("description", "")).strip() or None,
        "is_active": _to_bool(row.get("is_active"), True),
    }

    for field_name in (
        "code",
        "group_code",
        "is_terminal",
        "is_success",
        "allow_multiple",
        "record_readonly",
        "record_writable",
        "record_deletable",
        "sort_order",
    ):
        if hasattr(model, field_name):
            payload[field_name] = getattr(master_record, field_name)

    return payload


def _has_required_translation_values(row: dict[str, Any]) -> bool:
    return bool(str(row.get("name", "")).strip())


def _to_bool(value: Any, default: bool) -> bool:
    if value is None or value == "":
        return default

    if isinstance(value, bool):
        return value

    return str(value).strip().lower() not in {"false", "0", "no", "n"}


def _serialize_value(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, (date, datetime)):
        return value.isoformat()

    return value
