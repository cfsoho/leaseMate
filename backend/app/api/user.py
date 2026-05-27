from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import require_admin
from app.services.user_auth_service import (
    expire_email_confirmation_token,
    expire_active_email_confirmation_tokens_for_user,
    get_active_email_confirmation_tokens,
    get_email_link_dashboard_stats,
    list_user_login_sessions,
)
from app.db.schemas.user import (
    ActiveEmailLinkRead,
    EmailLinkDashboardStats,
    UserCreate,
    UserLoginSessionRead,
    UserPageRead,
    UserUpdate,
    UserRead,
)
from app.services.user_service import (
    create_user,
    get_user,
    get_users_page,
    update_user,
    delete_user,
)
from app.services.user_auth_service import activate_user, deactivate_user


router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(require_admin)]
)


@router.get("/email-links/active", response_model=List[ActiveEmailLinkRead])
def list_active_email_links(
    db: Session = Depends(get_db)
):
    return [
        ActiveEmailLinkRead(
            id=token.id,
            user_id=token.user_id,
            family_name=token.user.family_name,
            given_name=token.user.given_name,
            email=token.user.email,
            preferred_locale_code=token.user.preferred_locale_code,
            expires_at=token.expires_at,
            created_at=token.created_at,
        )
        for token in get_active_email_confirmation_tokens(db)
    ]


@router.patch("/email-links/{token_id}/expire")
def expire_email_link(
    token_id: UUID,
    db: Session = Depends(get_db)
):
    token = expire_email_confirmation_token(db, token_id)

    if not token:
        raise HTTPException(status_code=404, detail="Active email link not found")

    return {
        "message": "Email link expired successfully"
    }


@router.get("/email-links/stats", response_model=EmailLinkDashboardStats)
def email_link_stats(
    db: Session = Depends(get_db)
):
    return get_email_link_dashboard_stats(db)


@router.post("", response_model=UserRead)
def create(
    payload: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        user, _temporary_password = create_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return user


@router.get("", response_model=UserPageRead)
def list_all(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_direction: str = Query(default="asc", pattern="^(asc|desc)$"),
    family_name: Optional[str] = Query(default=None),
    given_name: Optional[str] = Query(default=None),
    email: Optional[str] = Query(default=None),
    phone: Optional[str] = Query(default=None),
    preferred_locale_code: Optional[str] = Query(default=None),
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    items, total = get_users_page(
        db,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_direction=sort_direction,
        exclude_user_id=current_user.id,
        family_name=family_name,
        given_name=given_name,
        email=email,
        phone=phone,
        preferred_locale_code=preferred_locale_code,
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{user_id}/login-sessions", response_model=List[UserLoginSessionRead])
def list_login_sessions(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    if not get_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")

    return list_user_login_sessions(db, user_id)


@router.get("/{user_id}", response_model=UserRead)
def get_one(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    user = get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/{user_id}", response_model=UserRead)
def update(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db)
):
    existing_user = get_user(db, user_id)

    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    email_changed = payload.email is not None and payload.email != existing_user.email

    try:
        user = update_user(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if email_changed:
        expire_active_email_confirmation_tokens_for_user(db, user.id)

    return user


@router.patch("/{user_id}/deactivate", response_model=UserRead)
def deactivate(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    user = deactivate_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    expire_active_email_confirmation_tokens_for_user(db, user.id)

    return user


@router.patch("/{user_id}/activate", response_model=UserRead)
def activate(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    user = activate_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.delete("/{user_id}")
def delete(
    user_id: UUID,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = delete_user(db, user_id, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")

    expire_active_email_confirmation_tokens_for_user(db, user_id)

    return {
        "message": "User deleted successfully"
    }
