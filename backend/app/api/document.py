from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_current_user
from app.db.schemas.document import (
    DocumentCreate,
    DocumentRead,
    DocumentUpdate,
)
from app.services.document_service import (
    create_document,
    delete_document,
    get_document,
    get_documents,
    update_document,
)


router = APIRouter(prefix="/documents", tags=["Documents"], dependencies=[Depends(require_current_user)])


@router.post("", response_model=DocumentRead)
def create(payload: DocumentCreate, db: Session = Depends(get_db)):
    return create_document(db, payload)


@router.get("", response_model=List[DocumentRead])
def list_all(
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    return get_documents(db, skip, limit, include_deleted)


@router.get("/{document_id}", response_model=DocumentRead)
def get_one(
    document_id: UUID,
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    document = get_document(db, document_id, include_deleted)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.put("/{document_id}", response_model=DocumentRead)
def update(
    document_id: UUID,
    payload: DocumentUpdate,
    db: Session = Depends(get_db)
):
    document = update_document(db, document_id, payload)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}")
def delete(
    document_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_document(db, document_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}
