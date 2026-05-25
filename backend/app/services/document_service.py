from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.document import Document
from app.db.schemas.document import DocumentCreate, DocumentUpdate
from app.services.soft_delete import soft_delete


def create_document(db: Session, payload: DocumentCreate) -> Document:
    document = Document(**payload.model_dump())
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document(
    db: Session,
    document_id: UUID,
    include_deleted: bool = False
) -> Optional[Document]:
    query = db.query(Document).filter(Document.id == document_id)

    if include_deleted:
        query = query.execution_options(include_deleted=True)
    else:
        query = query.filter(Document.is_deleted.is_(False))

    return query.first()


def get_documents(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False
):
    query = db.query(Document)

    if include_deleted:
        query = query.execution_options(include_deleted=True)
    else:
        query = query.filter(Document.is_deleted.is_(False))

    return query.offset(skip).limit(limit).all()


def update_document(
    db: Session,
    document_id: UUID,
    payload: DocumentUpdate
) -> Optional[Document]:
    document = get_document(db, document_id, include_deleted=True)
    if not document:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)
    return document


def delete_document(
    db: Session,
    document_id: UUID,
    deleted_by: Optional[UUID] = None
) -> bool:
    document = get_document(db, document_id)
    if not document:
        return False

    soft_delete(db, document, deleted_by)
    return True
