from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.db.models.user_delegation import UserDelegation
from app.db.schemas.user_delegation import (
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
        can_create_properties_for_subject=(
            delegation.can_create_properties_for_subject
        ),
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

    if not get_user(db, subject_user_id):
        raise ValueError("Subject user not found")

    delegate_user = get_user(db, payload.delegate_user_id)

    if not delegate_user:
        raise ValueError("Delegate user not found")

    if (
        delegate_created_by_user_id
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
        can_create_properties_for_subject=payload.can_create_properties_for_subject,
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

    for field, value in payload.model_dump(exclude_unset=True).items():
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
