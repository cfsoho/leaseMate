from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.db.models.user_delegation import UserDelegation
from app.db.schemas.user_delegation import (
    ACCESS_FIELD_NAMES,
    UserDelegationCreate,
    UserDelegationRead,
    UserDelegationUpdate,
)
from app.services.user_service import get_user


def _with_users(query):
    return query.options(
        joinedload(UserDelegation.subject_user),
        joinedload(UserDelegation.delegate_user),
    )


def _has_allowed_access_from_payload(payload: UserDelegationCreate) -> bool:
    return any(getattr(payload, field_name) for field_name in ACCESS_FIELD_NAMES)


def _has_allowed_access_after_update(
    delegation: UserDelegation,
    updates: dict,
) -> bool:
    return any(
        bool(updates.get(field_name, getattr(delegation, field_name)))
        for field_name in ACCESS_FIELD_NAMES
    )


def _serialize_delegation(delegation: UserDelegation) -> UserDelegationRead:
    return UserDelegationRead(
        id=delegation.id,
        subject_user_id=delegation.subject_user_id,
        delegate_user_id=delegation.delegate_user_id,
        subject_family_name=delegation.subject_user.family_name,
        subject_given_name=delegation.subject_user.given_name,
        subject_email=delegation.subject_user.email,
        delegate_family_name=delegation.delegate_user.family_name,
        delegate_given_name=delegation.delegate_user.given_name,
        delegate_email=delegation.delegate_user.email,
        relationship_type=delegation.relationship_type,
        can_view_legal_names=delegation.can_view_legal_names,
        can_manage_legal_names=delegation.can_manage_legal_names,
        can_view_bank_accounts=delegation.can_view_bank_accounts,
        can_manage_bank_accounts=delegation.can_manage_bank_accounts,
        can_view_user_account_info=delegation.can_view_user_account_info,
        can_manage_user_account_info=delegation.can_manage_user_account_info,
        can_view_properties=delegation.can_view_properties,
        can_manage_properties=delegation.can_manage_properties,
        is_active=delegation.is_active,
        created_at=delegation.created_at,
        updated_at=delegation.updated_at,
    )


def list_user_delegations(
    db: Session,
    subject_user_id: UUID,
) -> List[UserDelegationRead]:
    delegations = (
        _with_users(
            db.query(UserDelegation).filter(
                UserDelegation.subject_user_id == subject_user_id
            )
        )
        .order_by(UserDelegation.is_active.desc(), UserDelegation.created_at.asc())
        .all()
    )
    return [_serialize_delegation(delegation) for delegation in delegations]


def create_user_delegation(
    db: Session,
    subject_user_id: UUID,
    payload: UserDelegationCreate,
    delegate_created_by_user_id: Optional[UUID] = None,
) -> UserDelegationRead:
    if subject_user_id == payload.delegate_user_id:
        raise ValueError("An individual cannot delegate records to themselves")

    if not _has_allowed_access_from_payload(payload):
        raise ValueError("Select at least one allowed access")

    if not get_user(db, subject_user_id):
        raise ValueError("Subject user not found")

    delegate_user = get_user(db, payload.delegate_user_id)

    if not delegate_user:
        raise ValueError("Delegate user not found")

    if (
        delegate_created_by_user_id
        and delegate_user.id != delegate_created_by_user_id
        and delegate_user.created_by_user_id != delegate_created_by_user_id
    ):
        raise ValueError("Managed-by individual must be one you created")

    existing = (
        db.query(UserDelegation)
        .filter(
            UserDelegation.subject_user_id == subject_user_id,
            UserDelegation.delegate_user_id == payload.delegate_user_id,
        )
        .first()
    )
    if existing:
        raise ValueError("This delegation already exists")

    delegation = UserDelegation(
        subject_user_id=subject_user_id,
        delegate_user_id=payload.delegate_user_id,
        relationship_type=payload.relationship_type,
        can_view_legal_names=payload.can_view_legal_names,
        can_manage_legal_names=payload.can_manage_legal_names,
        can_view_bank_accounts=payload.can_view_bank_accounts,
        can_manage_bank_accounts=payload.can_manage_bank_accounts,
        can_view_user_account_info=payload.can_view_user_account_info,
        can_manage_user_account_info=payload.can_manage_user_account_info,
        can_view_properties=payload.can_view_properties,
        can_manage_properties=payload.can_manage_properties,
        is_active=payload.is_active,
    )
    db.add(delegation)
    db.commit()

    created = (
        _with_users(db.query(UserDelegation))
        .filter(UserDelegation.id == delegation.id)
        .one()
    )
    return _serialize_delegation(created)


def update_user_delegation(
    db: Session,
    subject_user_id: UUID,
    delegation_id: UUID,
    payload: UserDelegationUpdate,
) -> Optional[UserDelegationRead]:
    delegation = (
        db.query(UserDelegation)
        .filter(
            UserDelegation.id == delegation_id,
            UserDelegation.subject_user_id == subject_user_id,
        )
        .first()
    )
    if not delegation:
        return None

    updates = payload.model_dump(exclude_unset=True)

    if not _has_allowed_access_after_update(delegation, updates):
        raise ValueError("Select at least one allowed access")

    for field, value in updates.items():
        setattr(delegation, field, value)

    db.commit()

    updated = (
        _with_users(db.query(UserDelegation))
        .filter(UserDelegation.id == delegation_id)
        .one()
    )
    return _serialize_delegation(updated)


def delete_user_delegation(
    db: Session,
    subject_user_id: UUID,
    delegation_id: UUID,
) -> bool:
    delegation = (
        db.query(UserDelegation)
        .filter(
            UserDelegation.id == delegation_id,
            UserDelegation.subject_user_id == subject_user_id,
        )
        .first()
    )
    if not delegation:
        return False

    db.delete(delegation)
    db.commit()
    return True
