from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin

from app.db.schemas.ref.document_type import (
    DocumentTypeCreate,
    DocumentTypeUpdate,
    DocumentTypeRead,
)

from app.services.ref.document_type_service import (
    create_document_type,
    get_document_type,
    get_document_types,
    update_document_type,
    delete_document_type,
)

router = APIRouter(
    prefix="/document-types",
    tags=["Document Types"],
    dependencies=[Depends(require_admin)]
)


@router.post("", response_model=DocumentTypeRead)
def create(
    payload: DocumentTypeCreate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        return create_document_type(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=List[DocumentTypeRead])
def list_all(
    locale: str = "en",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_document_types(
        db,
        locale,
        skip,
        limit
    )


@router.get("/{document_type_id}/{locale}", response_model=DocumentTypeRead)
def get_one(
    document_type_id: UUID,
    locale: str,
    db: Session = Depends(get_db)
):

    document_type = get_document_type(
        db,
        document_type_id,
        locale
    )

    if not document_type:
        raise HTTPException(
            status_code=404,
            detail="Document type not found"
        )

    return document_type


@router.put("/{document_type_id}/{locale}", response_model=DocumentTypeRead)
def update(
    document_type_id: UUID,
    locale: str,
    payload: DocumentTypeUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        document_type = update_document_type(
            db,
            document_type_id,
            locale,
            payload
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if not document_type:
        raise HTTPException(
            status_code=404,
            detail="Document type not found"
        )

    return document_type


@router.delete("/{document_type_id}/{locale}")
def delete(
    document_type_id: UUID,
    locale: str,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):

    deleted = delete_document_type(
        db,
        document_type_id,
        locale,
        current_user.id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Document type not found"
        )

    return {
        "message": "Document type deleted successfully"
    }
