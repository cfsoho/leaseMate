from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas.user_auth import LoginRequest, AuthTokenResponse
from app.db.schemas.user import UserPasswordChange, UserRead

from app.services.user_auth_service import (
    authenticate_user,
    change_user_password,
    create_refresh_token,
    confirm_email_token,
    revoke_refresh_token,
)


router = APIRouter(
    prefix="/user-auth",
    tags=["User Auth"]
)


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

    refresh_token = create_refresh_token(
        db,
        user,
        device_info=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None
    )

    return {
        "access_token": "TODO_CREATE_JWT_ACCESS_TOKEN",
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    revoked = revoke_refresh_token(db, refresh_token)

    if not revoked:
        raise HTTPException(
            status_code=404,
            detail="Refresh token not found"
        )

    return {
        "message": "Logged out successfully"
    }


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
    user_id,
    payload: UserPasswordChange,
    db: Session = Depends(get_db)
):
    user = change_user_password(db, user_id, payload)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="User not found or old password is incorrect"
        )

    return user