import uuid

from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.ref.document_type import DocumentType

from app.db.schemas.ref.document_type import (
    DocumentTypeCreate,
    DocumentTypeUpdate,
)

from app.services.soft_delete import soft_delete
from app.services.ref.localized_shared_fields import (
    inherit_master_shared_fields,
    propagate_master_shared_fields,
)
from app.services.ref.translation_validation import ensure_translation_locale_available


DOCUMENT_TYPE_SHARED_FIELDS = {"code", "is_active"}

def create_document_type(
    db: Session,
    payload: DocumentTypeCreate
) -> DocumentType:

    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

    ensure_translation_locale_available(
        db,
        DocumentType,
        data["id"],
        data["locale"],
    )
    inherit_master_shared_fields(
        db,
        DocumentType,
        data,
        DOCUMENT_TYPE_SHARED_FIELDS,
    )

    document_type = DocumentType(**data)

    db.add(document_type)
    db.commit()
    db.refresh(document_type)

    return document_type


def get_document_type(
    db: Session,
    document_type_id: UUID,
    locale: str
) -> Optional[DocumentType]:

    return (
        db.query(DocumentType)
        .filter(
            DocumentType.id == document_type_id,
            DocumentType.locale == locale
        )
        .first()
    )


def get_document_types(
    db: Session,
    locale: str = "en",
    skip: int = 0,
    limit: int = 100
):

    return (
        db.query(DocumentType)
        .filter(DocumentType.locale == locale)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_document_type(
    db: Session,
    document_type_id: UUID,
    locale: str,
    payload: DocumentTypeUpdate
) -> Optional[DocumentType]:

    document_type = get_document_type(
        db,
        document_type_id,
        locale
    )

    if not document_type:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    ensure_translation_locale_available(
        db,
        DocumentType,
        document_type_id,
        update_data.get("locale"),
        locale,
    )

    for field, value in update_data.items():
        setattr(document_type, field, value)

    propagate_master_shared_fields(
        db,
        DocumentType,
        document_type_id,
        locale,
        update_data,
        DOCUMENT_TYPE_SHARED_FIELDS,
    )

    db.commit()
    db.refresh(document_type)

    return document_type


def delete_document_type(
    db: Session,
    document_type_id: UUID,
    locale: str,
    deleted_by: Optional[UUID] = None) -> bool:

    document_type = get_document_type(
        db,
        document_type_id,
        locale
    )

    if not document_type:
        return False
    soft_delete(db, document_type, deleted_by)

    return True

def upsert_document_types_from_list(
    db,
    items: list[dict]
) -> None:
    for item in items:
        existing_any_locale = (
            db.query(DocumentType)
            .filter(DocumentType.code == item["code"])
            .first()
        )

        shared_id = existing_any_locale.id if existing_any_locale else uuid.uuid4()

        for locale, translation in item["translations"].items():
            row = (
                db.query(DocumentType)
                .filter(
                    DocumentType.code == item["code"],
                    DocumentType.locale == locale
                )
                .first()
            )

            if row:
                row.name = translation["name"]
                row.description = translation.get("description")
                row.is_active = item.get("is_active", True)
            else:
                db.add(
                    DocumentType(
                        id=shared_id,
                        locale=locale,
                        code=item["code"],
                        name=translation["name"],
                        description=translation.get("description"),
                        is_active=item.get("is_active", True)
                    )
                )

    db.commit()
