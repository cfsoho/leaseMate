from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.dependencies import require_current_user
from app.db.database import get_db
from app.db.schemas.user_auth import (
    AccessTokenResponse,
    AuthTokenResponse,
    BootstrapAdminRequest,
    BootstrapAdminResponse,
    BootstrapLocaleResponse,
    BootstrapStatusResponse,
    EmailConfirmationResponse,
    CurrentUserLegalNamePayload,
    EmailVerificationResendRequest,
    EmailVerificationResendResponse,
    LoginRequest,
    RefreshTokenRequest,
)
from app.db.schemas.ref.country import CountryRead
from app.db.schemas.user import UserPasswordChange, UserProfileUpdate, UserRead
from app.db.schemas.user_legal_name import UserLegalNameCreate, UserLegalNameRead, UserLegalNameUpdate
from app.services.email_service import send_email_confirmation, send_user_invitation
from app.services.ref.country_service import get_countries
from app.services.user_legal_name_service import (
    create_user_legal_name,
    delete_user_legal_name,
    get_user_legal_name,
    get_user_legal_names_for_user,
    update_user_legal_name,
)
from app.services.user_service import get_user, get_user_by_email, update_user

from app.services.user_auth_service import (
    authenticate_user,
    bootstrap_admin_user,
    build_email_confirmation_url,
    change_user_password,
    create_access_token_from_refresh_token,
    create_email_confirmation_token_record,
    create_replacement_email_confirmation_token_record,
    EMAIL_CONFIRMATION_EXPIRE_HOURS,
    get_active_email_confirmation_token,
    get_bootstrap_locales,
    get_cached_admin_exists,
    issue_login_tokens,
    confirm_email_token,
    revoke_refresh_token,
)


router = APIRouter(prefix="/user-auth", tags=["User Auth"])


@router.get("/bootstrap-status", response_model=BootstrapStatusResponse)
def bootstrap_status(db: Session = Depends(get_db)):
    exists = get_cached_admin_exists(db)
    return {
        "admin_exists": exists,
        "bootstrap_required": not exists,
    }


@router.get("/bootstrap-locales", response_model=list[BootstrapLocaleResponse])
def bootstrap_locales(db: Session = Depends(get_db)):
    return get_bootstrap_locales(db)


@router.get("/profile-countries", response_model=list[CountryRead])
def profile_countries(
    _current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    return get_countries(db, 0, 300)


@router.post("/bootstrap-admin", response_model=BootstrapAdminResponse)
def bootstrap_admin(
    payload: BootstrapAdminRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        user, token_record, raw_token = bootstrap_admin_user(db, payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    verification_url = build_email_confirmation_url(raw_token)
    email_sent = send_email_confirmation(
        user.email,
        verification_url,
        user.preferred_locale_code,
    )
    access_token, refresh_token = issue_login_tokens(
        db=db,
        user=user,
        device_info=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None
    )

    return {
        "user_id": user.id,
        "email": user.email,
        "status": user.status,
        "email_sent": email_sent,
        "verification_token_expires_at": token_record.expires_at,
        "verification_url": verification_url,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=AuthTokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, payload)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials or inactive user"
        )

    access_token, refresh_token = issue_login_tokens(
        db=db,
        user=user,
        device_info=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_access_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    access_token = create_access_token_from_refresh_token(db, payload.refresh_token)

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired browser token"
        )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    revoked = revoke_refresh_token(db, payload.refresh_token)

    if not revoked:
        raise HTTPException(
            status_code=404,
            detail="Refresh token not found"
        )

    return {
        "message": "Logged out successfully"
    }


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(require_current_user)):
    return current_user


@router.post(
    "/email-confirmation/resend",
    response_model=EmailVerificationResendResponse,
)
def resend_email_confirmation(
    payload: EmailVerificationResendRequest | None = None,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    target_user = current_user

    if payload and (payload.user_id or payload.token_id):
        if not current_user.role or current_user.role.code != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")

        if payload.token_id:
            token_record = get_active_email_confirmation_token(db, payload.token_id)
            if not token_record:
                raise HTTPException(
                    status_code=404,
                    detail="Active verification record not found",
                )
            target_user = token_record.user
        elif payload.user_id:
            user = get_user(db, payload.user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            target_user = user

    if target_user.email_verified_at is not None:
        return {
            "already_verified": True,
            "email_sent": False,
            "verification_token_expires_at": None,
            "verification_url": None,
        }

    token_record, raw_token = create_replacement_email_confirmation_token_record(
        db,
        target_user,
        EMAIL_CONFIRMATION_EXPIRE_HOURS,
    )
    verification_url = build_email_confirmation_url(raw_token)
    email_sent = (
        send_user_invitation(
            target_user.email,
            verification_url,
            target_user.preferred_locale_code,
        )
        if target_user.password_must_change
        else send_email_confirmation(
            target_user.email,
            verification_url,
            target_user.preferred_locale_code,
        )
    )

    return {
        "already_verified": False,
        "email_sent": email_sent,
        "verification_token_expires_at": token_record.expires_at,
        "verification_url": verification_url,
    }


@router.post(
    "/me/resend-email-confirmation",
    response_model=EmailVerificationResendResponse,
)
def resend_my_email_confirmation(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    return resend_email_confirmation(None, current_user, db)


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserProfileUpdate,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    if payload.email and payload.email != current_user.email:
        existing_user = get_user_by_email(db, payload.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="User email already exists")

        current_user.email_verified_at = None

    user = update_user(db, current_user.id, payload)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/me/legal-names", response_model=list[UserLegalNameRead])
def my_legal_names(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    return get_user_legal_names_for_user(db, current_user.id)


@router.post("/me/legal-names", response_model=UserLegalNameRead)
def create_my_legal_name(
    payload: CurrentUserLegalNamePayload,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    return create_user_legal_name(
        db,
        UserLegalNameCreate(
            user_id=current_user.id,
            country_id=payload.country_id,
            locale_code=payload.locale_code,
            full_name=payload.full_name,
        ),
    )


@router.put("/me/legal-names/{legal_name_id}", response_model=UserLegalNameRead)
def update_my_legal_name(
    legal_name_id: UUID,
    payload: CurrentUserLegalNamePayload,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    legal_name = get_user_legal_name(db, legal_name_id)

    if not legal_name or legal_name.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="User legal name not found")

    updated = update_user_legal_name(
        db,
        legal_name_id,
        UserLegalNameUpdate(
            country_id=payload.country_id,
            locale_code=payload.locale_code,
            full_name=payload.full_name,
        ),
    )

    if not updated:
        raise HTTPException(status_code=404, detail="User legal name not found")

    return updated


@router.delete("/me/legal-names/{legal_name_id}")
def delete_my_legal_name(
    legal_name_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    legal_name = get_user_legal_name(db, legal_name_id)

    if not legal_name or legal_name.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="User legal name not found")

    deleted = delete_user_legal_name(db, legal_name_id, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="User legal name not found")

    return {
        "message": "User legal name deleted successfully"
    }


@router.get("/confirm-email/{token}", response_model=EmailConfirmationResponse)
def confirm_email(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    user, token_status = confirm_email_token(db, token)

    if token_status == "used":
        raise HTTPException(
            status_code=409,
            detail="Email already verified"
        )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired email confirmation token"
        )

    access_token, refresh_token = issue_login_tokens(
        db=db,
        user=user,
        device_info=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None
    )

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.patch("/users/{user_id}/password", response_model=UserRead)
def change_password(
    user_id: UUID,
    payload: UserPasswordChange,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and (
        not current_user.role or current_user.role.code != "ADMIN"
    ):
        raise HTTPException(status_code=403, detail="Cannot change another user's password")

    require_old_password = (
        current_user.id == user_id and not current_user.password_must_change
    )
    user, error_code = change_user_password(db, user_id, payload, require_old_password)

    if error_code == "new_password_same_as_current":
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="User not found or old password is incorrect"
        )

    return user
