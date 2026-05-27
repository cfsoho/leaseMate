from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.database import get_db
from app.services.ref.translation_service import (
    build_translation_template_csv,
    get_translation_model,
    get_translation_rows,
    serialize_translation_row,
    upload_translation_rows,
)


class TranslationUploadRequest(BaseModel):
    rows: list[dict[str, object]]


router = APIRouter(
    prefix="/setup-list-translations",
    tags=["Setup List Translations"],
    dependencies=[Depends(require_admin)],
)


@router.get("/{slug}/{shared_id}")
def list_translations(
    slug: str,
    shared_id: UUID,
    db: Session = Depends(get_db),
):
    if get_translation_model(slug) is None:
        raise HTTPException(status_code=404, detail="Setup list does not support translations")

    return [
        serialize_translation_row(row)
        for row in get_translation_rows(db, slug, shared_id)
    ]


@router.get("/{slug}/{shared_id}/template.csv")
def download_template(
    slug: str,
    shared_id: UUID,
    db: Session = Depends(get_db),
):
    if get_translation_model(slug) is None:
        raise HTTPException(status_code=404, detail="Setup list does not support translations")

    csv_text = build_translation_template_csv(db, slug, shared_id)
    if not csv_text:
        raise HTTPException(status_code=404, detail="Template source record not found")

    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{slug}-{shared_id}-translations-template.csv"'
        },
    )


@router.post("/{slug}/{shared_id}/upload")
def upload_translations(
    slug: str,
    shared_id: UUID,
    payload: TranslationUploadRequest,
    db: Session = Depends(get_db),
):
    if get_translation_model(slug) is None:
        raise HTTPException(status_code=404, detail="Setup list does not support translations")

    return upload_translation_rows(db, slug, shared_id, payload.rows)
