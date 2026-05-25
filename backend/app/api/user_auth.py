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
    BootstrapStatusResponse,
    LoginRequest,
    RefreshTokenRequest,
)
from app.db.schemas.user import UserPasswordChange, UserRead
from app.services.email_service import send_email_confirmation

from app.services.user_auth_service import (
    admin_exists,
    authenticate_user,
    bootstrap_admin_user,
    build_email_confirmation_url,
    change_user_password,
    create_access_token_from_refresh_token,
    issue_login_tokens,
    confirm_email_token,
    revoke_refresh_token,
)


router = APIRouter(prefix="/user-auth", tags=["User Auth"])


@router.get("/bootstrap-status", response_model=BootstrapStatusResponse)
def bootstrap_status(db: Session = Depends(get_db)):
    exists = admin_exists(db)
    return {
        "admin_exists": exists,
        "bootstrap_required": not exists,
    }


@router.post("/bootstrap-admin", response_model=BootstrapAdminResponse)
def bootstrap_admin(
    payload: BootstrapAdminRequest,
    db: Session = Depends(get_db)
):
    try:
        user, token_record, raw_token = bootstrap_admin_user(db, payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    verification_url = build_email_confirmation_url(raw_token)
    email_sent = send_email_confirmation(user.email, verification_url)

    return {
        "user_id": user.id,
        "email": user.email,
        "status": user.status,
        "email_sent": email_sent,
        "verification_token_expires_at": token_record.expires_at,
        "verification_url": verification_url,
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


@router.get("/confirm-email/{token}", response_model=UserRead)
def confirm_email(
    token: str,
    db: Session = Depends(get_db)
):
    user = confirm_email_token(db, token)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired email confirmation token"
        )

    return user


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

    require_old_password = current_user.id == user_id
    user = change_user_password(db, user_id, payload, require_old_password)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="User not found or old password is incorrect"
        )

    return user
