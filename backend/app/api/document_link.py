from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.document_link import (
    DocumentLinkCreate,
    DocumentLinkRead,
    DocumentLinkUpdate,
)
from app.services.document_link_service import (
    create_document_link,
    delete_document_link,
    get_document_link,
    get_document_links,
    update_document_link,
)


router = APIRouter(prefix="/document-links", tags=["Document Links"], dependencies=[Depends(require_current_user)])


@router.post("", response_model=DocumentLinkRead)
def create(payload: DocumentLinkCreate, db: Session = Depends(get_db)):
    return create_document_link(db, payload)


@router.get("", response_model=List[DocumentLinkRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    document_id: Optional[UUID] = None,
    object_type: Optional[str] = None,
    object_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    return get_document_links(
        db=db,
        skip=skip,
        limit=limit,
        document_id=document_id,
        object_type=object_type,
        object_id=object_id,
    )


@router.get("/{document_link_id}", response_model=DocumentLinkRead)
def get_one(document_link_id: UUID, db: Session = Depends(get_db)):
    document_link = get_document_link(db, document_link_id)
    if not document_link:
        raise HTTPException(status_code=404, detail="Document link not found")
    return document_link


@router.put("/{document_link_id}", response_model=DocumentLinkRead)
def update(
    document_link_id: UUID,
    payload: DocumentLinkUpdate,
    db: Session = Depends(get_db)
):
    document_link = update_document_link(db, document_link_id, payload)
    if not document_link:
        raise HTTPException(status_code=404, detail="Document link not found")
    return document_link


@router.delete("/{document_link_id}")
def delete(
    document_link_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_document_link(db, document_link_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document link not found")
    return {"message": "Document link deleted successfully"}
