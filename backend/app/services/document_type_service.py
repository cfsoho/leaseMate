import uuid

from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.document_type import DocumentType

from app.db.schemas.document_type import (
    DocumentTypeCreate,
    DocumentTypeUpdate,
)


def create_document_type(
    db: Session,
    payload: DocumentTypeCreate
) -> DocumentType:

    data = payload.model_dump()

    if data.get("id") is None:
        data["id"] = uuid.uuid4()

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

    for field, value in update_data.items():
        setattr(document_type, field, value)

    db.commit()
    db.refresh(document_type)

    return document_type


def delete_document_type(
    db: Session,
    document_type_id: UUID,
    locale: str
) -> bool:

    document_type = get_document_type(
        db,
        document_type_id,
        locale
    )

    if not document_type:
        return False

    db.delete(document_type)
    db.commit()

    return True