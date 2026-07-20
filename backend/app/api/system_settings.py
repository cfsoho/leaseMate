import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.database import get_db
from app.db.models.user import User
from app.db.schemas.system_settings import (
    SystemEmailSettingsRead,
    SystemEmailSettingsStatus,
    SystemEmailSettingsTestResponse,
    SystemEmailSettingsUpdate,
    SystemStorageSettingsRead,
    SystemStorageSettingsTestResponse,
    SystemStorageSettingsUpdate,
)
from app.services.email_service import send_email
from app.services.email_templates.system_settings import (
    build_system_email_verification_message,
)
from app.services.realtime_manager import realtime_manager
from app.services.system_settings_service import (
    confirm_system_email_settings_token,
    get_system_email_identity_verification_token,
    get_system_email_settings_status,
    get_or_create_email_system_setting,
    get_or_create_storage_system_setting,
    is_system_email_settings_complete,
    mark_system_email_test_result,
    start_system_email_settings_verification,
    to_system_email_settings_read,
    test_system_storage_settings,
    update_system_email_settings,
    to_system_storage_settings_read,
    update_system_storage_settings,
)


APP_PUBLIC_URL = os.getenv("APP_PUBLIC_URL", "http://localhost:3000")

public_router = APIRouter(
    prefix="/system-settings",
    tags=["System Settings"],
)

router = APIRouter(
    prefix="/system-settings",
    tags=["System Settings"],
    dependencies=[Depends(require_admin)],
)


@router.get("/email", response_model=SystemEmailSettingsRead)
def get_email_settings(db: Session = Depends(get_db)):
    return to_system_email_settings_read(get_or_create_email_system_setting(db))


@router.get("/email/status", response_model=SystemEmailSettingsStatus)
def get_email_settings_status(db: Session = Depends(get_db)):
    return get_system_email_settings_status(db)


@router.put("/email", response_model=SystemEmailSettingsRead)
def save_email_settings(
    payload: SystemEmailSettingsUpdate,
    db: Session = Depends(get_db),
):
    return to_system_email_settings_read(update_system_email_settings(db, payload))


@router.get("/storage", response_model=SystemStorageSettingsRead)
def get_storage_settings(db: Session = Depends(get_db)):
    return to_system_storage_settings_read(get_or_create_storage_system_setting(db))


@router.put("/storage", response_model=SystemStorageSettingsRead)
def save_storage_settings(
    payload: SystemStorageSettingsUpdate,
    db: Session = Depends(get_db),
):
    return to_system_storage_settings_read(update_system_storage_settings(db, payload))


@router.post("/storage/test", response_model=SystemStorageSettingsTestResponse)
async def test_storage_settings(db: Session = Depends(get_db)):
    settings = test_system_storage_settings(db)
    if not settings.is_verified:
        raise HTTPException(
            status_code=400,
            detail=settings.last_test_error or "Storage test failed.",
        )

    await realtime_manager.send_to_all(
        "system_setup_changed",
        {
            "reason": "storage_settings_verified",
            "system_ready": True,
        },
    )
    return {
        "success": True,
        "is_ready": True,
        "storage_verified_at": settings.verified_at,
        "storage_last_tested_at": settings.last_tested_at,
        "storage_last_test_error": None,
    }


@public_router.get("/email/verify/{token}", response_model=SystemEmailSettingsTestResponse)
async def verify_email_settings(
    token: str,
    db: Session = Depends(get_db),
):
    settings = confirm_system_email_settings_token(db, token)
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP verification link is invalid or expired.")

    status = get_system_email_settings_status(db)
    await realtime_manager.send_to_all(
        "system_setup_changed",
        {
            "reason": "email_settings_verified",
            "system_ready": status["is_ready"],
        },
    )
    return {
        "success": True,
        "is_ready": status["is_ready"],
        "smtp_verified_at": settings.verified_at,
        "smtp_verification_sent_at": settings.verification_sent_at,
        "smtp_verification_expires_at": settings.verification_expires_at,
        "smtp_last_test_error": None,
    }


@router.post("/email/test", response_model=SystemEmailSettingsTestResponse)
async def test_email_settings(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    settings = get_or_create_email_system_setting(db)
    if not is_system_email_settings_complete(settings):
        settings = mark_system_email_test_result(
            db,
            success=False,
            error_message="SMTP settings are incomplete.",
        )
        raise HTTPException(status_code=400, detail=settings.last_test_error)

    settings = start_system_email_settings_verification(db)
    noreply_token = get_system_email_identity_verification_token(settings, "noreply")
    system_token = get_system_email_identity_verification_token(settings, "system")
    if not noreply_token or not system_token:
        settings = mark_system_email_test_result(
            db,
            success=False,
            error_message="SMTP verification token creation failed.",
        )
        raise HTTPException(status_code=500, detail=settings.last_test_error)

    noreply_verification_url = (
        f"{APP_PUBLIC_URL.rstrip('/')}/settings/email/verify/"
        f"{noreply_token}"
    )
    system_verification_url = (
        f"{APP_PUBLIC_URL.rstrip('/')}/settings/email/verify/"
        f"{system_token}"
    )
    noreply_subject, noreply_text, noreply_html = build_system_email_verification_message(
        account_label="no-reply",
        verification_url=noreply_verification_url,
        locale_code=current_user.preferred_locale_code,
    )
    system_subject, system_text, system_html = build_system_email_verification_message(
        account_label="system",
        verification_url=system_verification_url,
        locale_code=current_user.preferred_locale_code,
    )
    noreply_sent = send_email(
        to_email=current_user.email,
        subject=noreply_subject,
        body=noreply_text,
        html_body=noreply_html,
        identity="noreply",
        db=db,
    )
    system_sent = send_email(
        to_email=current_user.email,
        subject=system_subject,
        body=system_text,
        html_body=system_html,
        identity="system",
        db=db,
    )

    if not (noreply_sent and system_sent):
        settings = mark_system_email_test_result(
            db,
            success=False,
            error_message="SMTP test failed. Check the host, port, users, passwords, and from addresses.",
        )
        raise HTTPException(status_code=400, detail=settings.last_test_error)

    settings = mark_system_email_test_result(db, success=True)
    await realtime_manager.send_to_all(
        "system_setup_changed",
        {
            "reason": "email_settings_verification_sent",
            "system_ready": False,
        },
    )
    return {
        "success": True,
        "is_ready": False,
        "smtp_verified_at": settings.verified_at,
        "smtp_verification_sent_at": settings.verification_sent_at,
        "smtp_verification_expires_at": settings.verification_expires_at,
        "smtp_last_test_error": None,
    }
