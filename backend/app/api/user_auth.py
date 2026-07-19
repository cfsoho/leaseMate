from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.dependencies import bearer_scheme, require_current_user
from app.db.database import get_db
from app.db.schemas.user_auth import (
    AccessTokenResponse,
    AuthTokenResponse,
    BootstrapAdminRequest,
    BootstrapAdminResponse,
    BootstrapDefaultLocaleResponse,
    BootstrapLocaleResponse,
    BootstrapStatusResponse,
    CurrentUserReadinessResponse,
    EmailConfirmationResponse,
    CurrentUserLegalNamePayload,
    EmailVerificationResendRequest,
    EmailVerificationResendResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutSessionsRequest,
    PasskeyAuthenticationOptionsRequest,
    PasskeyAuthenticationVerifyRequest,
    PasskeyOptionsResponse,
    PasskeyRegistrationVerifyRequest,
    PasswordResetTokenStatusResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    UserLoginSessionResponse,
    UserPasskeyResponse,
)
from app.db.models.financial_account import FinancialAccount
from app.db.models.property import Property
from app.db.models.user_legal_name import UserLegalName
from app.db.schemas.ref.country import CountryRead
from app.db.schemas.user import UserPasswordChange, UserProfileUpdate, UserRead
from app.db.schemas.user_legal_name import UserLegalNameCreate, UserLegalNameRead, UserLegalNameUpdate
from app.services.email_service import (
    send_email_confirmation,
    send_password_reset,
    send_user_invitation,
)
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
    build_password_reset_url,
    change_user_password,
    create_access_token_from_refresh_token,
    create_email_confirmation_token_record,
    create_passkey_authentication_options,
    create_passkey_registration_options,
    create_password_reset_for_verified_email,
    create_replacement_email_confirmation_token_record,
    EMAIL_CONFIRMATION_EXPIRE_HOURS,
    get_active_email_confirmation_token,
    get_bootstrap_default_locale,
    get_bootstrap_locales,
    get_cached_admin_exists,
    get_login_session_status,
    get_password_reset_token_status,
    get_session_id_from_access_token,
    invalidate_user_sessions,
    issue_login_tokens,
    list_user_login_sessions,
    list_user_passkeys,
    confirm_email_token,
    reset_password_with_token,
    authenticate_user_with_passkey,
    delete_user_passkey,
    revoke_other_user_sessions,
    revoke_refresh_token,
    revoke_user_session,
    verify_passkey_registration,
)
from app.services.realtime_manager import realtime_manager


router = APIRouter(prefix="/user-auth", tags=["User Auth"])


def _first_header_value(request: Request, names: tuple[str, ...]) -> str | None:
    for name in names:
        value = request.headers.get(name)
        if value:
            return value[:100]
    return None


def _login_context(request: Request) -> dict[str, str | None]:
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = (
        forwarded_for.split(",", 1)[0].strip()
        if forwarded_for
        else request.client.host if request.client else None
    )

    return {
        "device_info": request.headers.get("user-agent"),
        "ip_address": client_ip,
        "location_country_code": _first_header_value(
            request,
            ("cf-ipcountry", "x-geo-country", "x-vercel-ip-country"),
        ),
        "location_region": _first_header_value(
            request,
            (
                "x-geo-district",
                "x-district",
                "x-geo-region",
                "x-vercel-ip-country-region",
                "x-region",
            ),
        ),
        "location_city": _first_header_value(
            request,
            ("x-geo-city", "x-vercel-ip-city", "x-city"),
        ),
    }


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


@router.get("/bootstrap-default-locale", response_model=BootstrapDefaultLocaleResponse)
def bootstrap_default_locale(
    request: Request,
    db: Session = Depends(get_db),
):
    locale_code, country_alpha2 = get_bootstrap_default_locale(
        db,
        request.headers,
    )
    return {
        "locale_code": locale_code,
        "country_alpha2": country_alpha2,
    }


@router.get("/profile-countries", response_model=list[CountryRead])
def profile_countries(
    _current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    return get_countries(db, 0, 300)


@router.post("/bootstrap-admin", response_model=BootstrapAdminResponse)
async def bootstrap_admin(
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
        **_login_context(request),
    )
    await _notify_login_created(db, user.id, access_token)

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
async def login(
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
        **_login_context(request),
    )
    await _notify_login_created(db, user.id, access_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post(
    "/me/passkeys/registration-options",
    response_model=PasskeyOptionsResponse,
)
def passkey_registration_options(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    if current_user.email_verified_at is None:
        raise HTTPException(
            status_code=403,
            detail="Verify your email before adding a passkey",
        )

    return {"options": create_passkey_registration_options(db, current_user)}


@router.post("/me/passkeys/registration-verify", response_model=UserPasskeyResponse)
def passkey_registration_verify(
    payload: PasskeyRegistrationVerifyRequest,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    passkey, error_code = verify_passkey_registration(
        db,
        current_user,
        payload.credential,
        payload.name,
    )

    if error_code:
        raise HTTPException(status_code=400, detail="Passkey registration failed")

    return passkey


@router.get("/me/passkeys", response_model=list[UserPasskeyResponse])
def my_passkeys(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    return list_user_passkeys(db, current_user.id)


@router.delete("/me/passkeys/{passkey_id}")
def remove_my_passkey(
    passkey_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_user_passkey(db, current_user.id, passkey_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Passkey not found")
    return {"message": "Passkey removed"}


@router.post("/passkeys/authentication-options", response_model=PasskeyOptionsResponse)
def passkey_authentication_options(
    payload: PasskeyAuthenticationOptionsRequest | None = None,
    db: Session = Depends(get_db),
):
    return {
        "options": create_passkey_authentication_options(
            db,
            payload.email if payload else None,
        )
    }


@router.post("/passkeys/authentication-verify", response_model=AuthTokenResponse)
async def passkey_authentication_verify(
    payload: PasskeyAuthenticationVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user, error_code = authenticate_user_with_passkey(db, payload.credential)
    if error_code or not user:
        raise HTTPException(status_code=401, detail="Passkey sign-in failed")

    access_token, refresh_token = issue_login_tokens(
        db=db,
        user=user,
        **_login_context(request),
    )
    await _notify_login_created(db, user.id, access_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user, token_record, raw_token = create_password_reset_for_verified_email(
        db,
        payload.email,
    )

    if not user or not token_record or not raw_token:
        return {
            "email_sent": False,
            "password_reset_token_expires_at": None,
            "reset_url": None,
            "message": (
                "If this verified email exists, LeaseMate will send a password "
                "reset link."
            ),
        }

    reset_url = build_password_reset_url(raw_token)
    email_sent = send_password_reset(
        user.email,
        reset_url,
        user.preferred_locale_code,
    )

    return {
        "email_sent": email_sent,
        "password_reset_token_expires_at": token_record.expires_at,
        "reset_url": reset_url,
        "message": (
            "If this verified email exists, LeaseMate will send a password "
            "reset link."
        ),
    }


@router.get(
    "/reset-password/{token}",
    response_model=PasswordResetTokenStatusResponse,
)
def password_reset_token_status(
    token: str,
    db: Session = Depends(get_db),
):
    user, token_status = get_password_reset_token_status(db, token)
    valid = token_status == "valid"

    return {
        "valid": valid,
        "status": token_status,
        "email": user.email if valid and user else None,
    }


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    _user, error_code = reset_password_with_token(
        db,
        payload.token,
        payload.new_password,
    )

    if error_code == "new_password_same_as_current":
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )

    if error_code:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link",
        )

    return {
        "password_reset": True,
        "message": "Password has been reset.",
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


@router.get("/me/sessions", response_model=list[UserLoginSessionResponse])
def my_login_sessions(
    current_user=Depends(require_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    current_session_id = (
        get_session_id_from_access_token(credentials.credentials)
        if credentials
        else None
    )
    payload = []
    for session in list_user_login_sessions(db, current_user.id):
        is_connected = realtime_manager.is_session_connected(session.id)
        session_status = get_login_session_status(session, is_connected)
        payload.append({
            "id": session.id,
            "device_info": session.device_info,
            "ip_address": session.ip_address,
            "location_country_code": session.location_country_code,
            "location_region": session.location_region,
            "location_city": session.location_city,
            "expires_at": session.expires_at,
            "revoked_at": session.revoked_at,
            "last_used_at": session.last_used_at,
            "created_at": session.created_at,
            "is_current": session.id == current_session_id,
            "is_online": session_status == "online",
            "session_status": session_status,
        })
    return payload


async def _notify_sessions_revoked(session_ids: list[UUID]) -> None:
    for session_id in session_ids:
        await realtime_manager.send_to_session(
            session_id,
            "session_revoked",
            {"session_id": str(session_id)},
        )


async def _notify_user_sessions_changed(
    db: Session,
    user_id: UUID,
    excluded_session_ids: set[UUID] | None = None,
    payload: dict[str, str] | None = None,
) -> None:
    excluded_session_ids = excluded_session_ids or set()
    for session in list_user_login_sessions(db, user_id):
        if session.id in excluded_session_ids:
            continue
        await realtime_manager.send_to_session(
            session.id,
            "sessions_changed",
            payload or {},
        )


async def _notify_login_created(
    db: Session,
    user_id: UUID,
    access_token: str,
) -> None:
    current_session_id = get_session_id_from_access_token(access_token)
    if not current_session_id:
        return

    await _notify_user_sessions_changed(
        db,
        user_id,
        {current_session_id},
        {
            "reason": "device_logged_in",
            "session_id": str(current_session_id),
        },
    )


@router.delete("/me/sessions/{session_id}")
async def revoke_my_login_session(
    session_id: UUID,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    revoked_session_ids = revoke_user_session(db, current_user.id, session_id)
    if not revoked_session_ids:
        raise HTTPException(status_code=404, detail="Login session not found")
    await _notify_sessions_revoked(revoked_session_ids)
    return {"message": "Login session revoked"}


@router.post("/me/sessions/logout-others")
async def logout_other_devices(
    payload: LogoutSessionsRequest | None = None,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    revoked_session_ids = revoke_other_user_sessions(
        db,
        current_user,
        payload.refresh_token if payload else None,
    )
    await _notify_sessions_revoked(revoked_session_ids)
    return {"revoked_count": len(revoked_session_ids)}


@router.post("/me/sessions/logout-all")
async def logout_all_devices(
    request: Request,
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db),
):
    auth_header = request.headers.get("authorization", "")
    current_session_id = None
    if auth_header.lower().startswith("bearer "):
        current_session_id = get_session_id_from_access_token(auth_header[7:])

    session_ids = [
        session.id
        for session in current_user.refresh_tokens
        if session.revoked_at is None
    ]
    invalidate_user_sessions(db, current_user)
    db.commit()
    await _notify_sessions_revoked(
        [
            session_id
            for session_id in session_ids
            if session_id != current_session_id
        ]
    )
    return {"message": "All devices logged out"}


@router.get("/me/readiness", response_model=CurrentUserReadinessResponse)
def my_readiness(
    current_user=Depends(require_current_user),
    db: Session = Depends(get_db)
):
    legal_name_count = (
        db.query(UserLegalName)
        .filter(UserLegalName.user_id == current_user.id)
        .count()
    )
    property_count = (
        db.query(Property)
        .filter(Property.user_id == current_user.id)
        .count()
    )
    financial_account_count = (
        db.query(FinancialAccount)
        .filter(FinancialAccount.user_id == current_user.id)
        .count()
    )

    return {
        "legal_name_count": legal_name_count,
        "property_count": property_count,
        "financial_account_count": financial_account_count,
    }


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
async def confirm_email(
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
        **_login_context(request),
    )
    await _notify_login_created(db, user.id, access_token)

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

    if error_code == "old_password_incorrect":
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

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
