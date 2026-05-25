from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.user import User
from app.services.user_auth_service import get_user_from_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def require_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing access token")

    user = get_user_from_access_token(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    return user


def require_admin(current_user: User = Depends(require_current_user)) -> User:
    if not current_user.role or current_user.role.code != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user
