from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.ref.status_code import StatusCode


def get_status_code_id(
    db: Session,
    *,
    code: str,
    group_code: str,
    locale: str = "en",
) -> UUID:
    status_code_id = (
        db.query(StatusCode.id)
        .filter(
            StatusCode.group_code == group_code,
            StatusCode.code == code,
            StatusCode.locale == locale,
            StatusCode.is_active.is_(True),
        )
        .scalar()
    )

    if not status_code_id:
        raise ValueError(f"Missing status code seed: {group_code}.{code}.{locale}")

    return status_code_id


def apply_default_status(
    db: Session,
    data: dict,
    *,
    code: str,
    group_code: str,
) -> dict:
    if data.get("status_id") is None:
        data["status_id"] = get_status_code_id(
            db,
            code=code,
            group_code=group_code,
        )

    return data
