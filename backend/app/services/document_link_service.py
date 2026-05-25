from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.document_link import DocumentLink
from app.db.schemas.document_link import DocumentLinkCreate, DocumentLinkUpdate

from app.services.soft_delete import soft_delete

def create_document_link(
    db: Session,
    payload: DocumentLinkCreate
) -> DocumentLink:
    document_link = DocumentLink(**payload.model_dump())
    db.add(document_link)
    db.commit()
    db.refresh(document_link)
    return document_link


def get_document_link(
    db: Session,
    document_link_id: UUID
) -> Optional[DocumentLink]:
    return (
        db.query(DocumentLink)
        .filter(DocumentLink.id == document_link_id)
        .first()
    )


def get_document_links(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    document_id: Optional[UUID] = None,
    object_type: Optional[str] = None,
    object_id: Optional[UUID] = None
):
    query = db.query(DocumentLink)

    if document_id is not None:
        query = query.filter(DocumentLink.document_id == document_id)

    if object_type is not None:
        query = query.filter(DocumentLink.object_type == object_type)

    if object_id is not None:
        query = query.filter(DocumentLink.object_id == object_id)

    return query.offset(skip).limit(limit).all()


def update_document_link(
    db: Session,
    document_link_id: UUID,
    payload: DocumentLinkUpdate
) -> Optional[DocumentLink]:
    document_link = get_document_link(db, document_link_id)
    if not document_link:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(document_link, field, value)

    db.commit()
    db.refresh(document_link)
    return document_link


def delete_document_link(db: Session, document_link_id: UUID,
    deleted_by: Optional[UUID] = None) -> bool:
    document_link = get_document_link(db, document_link_id)
    if not document_link:
        return False
    soft_delete(db, document_link, deleted_by)
    return True
