from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
import secrets
from typing import Any
import uuid

from sqlalchemy.orm import Session

from app.db.models.enums.system_setting import (
    SystemSettingConfigKey,
    SystemSettingKey,
    SystemSettingSecretKey,
)
from app.db.models.system_setting import SystemSetting
from app.db.schemas.system_settings import (
    SystemEmailSettingsUpdate,
    SystemStorageSettingsUpdate,
)


SETTING_VERIFICATION_TOKEN_HOURS = 24
EMAIL_SETTING_IDENTITIES = ("noreply", "system")
STORAGE_PROVIDER_LOCAL_MOUNT = "LOCAL_MOUNT"
STORAGE_PROVIDER_S3 = "S3"
LOCAL_STORAGE_MOUNT_ROOT = os.getenv("STORAGE_LOCAL_MOUNT_ROOT", "/app/storage")


@dataclass(frozen=True)
class SmtpConfig:
    host: str | None
    port: int
    use_tls: bool
    user: str | None
    password: str | None
    from_address: str


def _key(value: SystemSettingKey | SystemSettingConfigKey | SystemSettingSecretKey) -> str:
    return value.value


def _config_value(
    setting: SystemSetting,
    key: SystemSettingConfigKey,
    default: Any = None,
) -> Any:
    return (setting.config or {}).get(_key(key), default)


def _secret_value(
    setting: SystemSetting,
    key: SystemSettingSecretKey,
    default: Any = None,
) -> Any:
    return (setting.secret_config or {}).get(_key(key), default)


def _datetime_to_config(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _datetime_from_config(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if not value or not isinstance(value, str):
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _email_identity_config_key(
    identity: str,
    field: str,
) -> SystemSettingConfigKey:
    normalized_identity = identity.lower()
    if normalized_identity not in EMAIL_SETTING_IDENTITIES:
        raise ValueError(f"Unknown email setting identity: {identity}")
    key_name = f"{normalized_identity.upper()}_{field}"
    return SystemSettingConfigKey[key_name]


def _email_identity_config_value(
    setting: SystemSetting,
    identity: str,
    field: str,
) -> Any:
    return _config_value(setting, _email_identity_config_key(identity, field))


def _email_identity_verified_at(
    setting: SystemSetting,
    identity: str,
) -> datetime | None:
    return _datetime_from_config(
        _email_identity_config_value(setting, identity, "VERIFIED_AT"),
    )


def _clear_email_identity_verification(config: dict[str, Any]) -> None:
    for identity in EMAIL_SETTING_IDENTITIES:
        for field in (
            "VERIFIED_AT",
            "VERIFICATION_TOKEN",
            "VERIFICATION_SENT_AT",
            "VERIFICATION_EXPIRES_AT",
        ):
            config[_key(_email_identity_config_key(identity, field))] = None


def _set_aggregate_email_verification_state(setting: SystemSetting) -> None:
    verified_times = [
        _email_identity_verified_at(setting, identity)
        for identity in EMAIL_SETTING_IDENTITIES
    ]
    if all(verified_times):
        setting.is_verified = True
        setting.verified_at = max(verified_times)
    else:
        setting.is_verified = False
        setting.verified_at = None


def get_system_email_identity_verification_token(
    setting: SystemSetting,
    identity: str,
) -> str | None:
    token = _email_identity_config_value(setting, identity, "VERIFICATION_TOKEN")
    return str(token) if token else None


def get_or_create_system_setting(
    db: Session,
    setting_key: SystemSettingKey,
) -> SystemSetting:
    setting = (
        db.query(SystemSetting)
        .filter(SystemSetting.setting_key == _key(setting_key))
        .first()
    )
    if setting:
        return setting

    setting = SystemSetting(
        setting_key=_key(setting_key),
        config={},
        secret_config={},
        is_verified=False,
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def get_or_create_email_system_setting(db: Session) -> SystemSetting:
    return get_or_create_system_setting(db, SystemSettingKey.EMAIL)


def get_or_create_storage_system_setting(db: Session) -> SystemSetting:
    return get_or_create_system_setting(db, SystemSettingKey.STORAGE)


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _storage_config_bool(setting: SystemSetting, key: SystemSettingConfigKey) -> bool:
    return bool(_config_value(setting, key, False))


def _safe_local_storage_path(local_folder: str) -> Path:
    folder = Path(local_folder)
    if folder.is_absolute() or ".." in folder.parts:
        raise ValueError("Local storage folder must be a relative folder name.")

    root = Path(LOCAL_STORAGE_MOUNT_ROOT)
    return root / folder


def update_system_storage_settings(
    db: Session,
    payload: SystemStorageSettingsUpdate,
) -> SystemSetting:
    setting = get_or_create_storage_system_setting(db)
    data = payload.model_dump()
    config = dict(setting.config or {})
    secret_config = dict(setting.secret_config or {})

    provider = data["provider"]
    config[_key(SystemSettingConfigKey.STORAGE_PROVIDER)] = provider
    config[_key(SystemSettingConfigKey.STORAGE_LOCAL_FOLDER)] = _clean_optional_text(
        data["local_folder"],
    )
    config[_key(SystemSettingConfigKey.STORAGE_S3_BUCKET)] = _clean_optional_text(
        data["s3_bucket"],
    )
    config[_key(SystemSettingConfigKey.STORAGE_S3_REGION)] = _clean_optional_text(
        data["s3_region"],
    )
    config[_key(SystemSettingConfigKey.STORAGE_S3_ENDPOINT_URL)] = _clean_optional_text(
        data["s3_endpoint_url"],
    )
    config[_key(SystemSettingConfigKey.STORAGE_S3_BASE_PREFIX)] = _clean_optional_text(
        data["s3_base_prefix"],
    )
    config[_key(SystemSettingConfigKey.STORAGE_S3_USE_PATH_STYLE)] = bool(
        data["s3_use_path_style"],
    )
    config[_key(SystemSettingConfigKey.STORAGE_S3_ACCESS_KEY_ID)] = _clean_optional_text(
        data["s3_access_key_id"],
    )

    if data["clear_s3_secret_access_key"]:
        secret_config.pop(_key(SystemSettingSecretKey.STORAGE_S3_SECRET_ACCESS_KEY), None)
    elif data["s3_secret_access_key"]:
        secret_config[_key(SystemSettingSecretKey.STORAGE_S3_SECRET_ACCESS_KEY)] = data[
            "s3_secret_access_key"
        ]

    setting.config = config
    setting.secret_config = secret_config
    setting.is_verified = False
    setting.verified_at = None
    setting.verification_token = None
    setting.verification_sent_at = None
    setting.verification_expires_at = None
    setting.last_tested_at = None
    setting.last_test_error = None

    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def is_system_storage_settings_complete(setting: SystemSetting) -> bool:
    provider = _config_value(setting, SystemSettingConfigKey.STORAGE_PROVIDER)
    if provider == STORAGE_PROVIDER_LOCAL_MOUNT:
        return bool(_config_value(setting, SystemSettingConfigKey.STORAGE_LOCAL_FOLDER))

    if provider == STORAGE_PROVIDER_S3:
        return bool(
            _config_value(setting, SystemSettingConfigKey.STORAGE_S3_BUCKET)
            and _config_value(setting, SystemSettingConfigKey.STORAGE_S3_REGION)
            and _config_value(setting, SystemSettingConfigKey.STORAGE_S3_ACCESS_KEY_ID)
            and _secret_value(setting, SystemSettingSecretKey.STORAGE_S3_SECRET_ACCESS_KEY)
        )

    return False


def is_system_storage_settings_ready(setting: SystemSetting) -> bool:
    return bool(
        is_system_storage_settings_complete(setting)
        and setting.is_verified
        and setting.verified_at
    )


def to_system_storage_settings_read(setting: SystemSetting) -> dict:
    is_complete = is_system_storage_settings_complete(setting)
    return {
        "id": setting.id,
        "provider": _config_value(setting, SystemSettingConfigKey.STORAGE_PROVIDER),
        "local_folder": _config_value(
            setting,
            SystemSettingConfigKey.STORAGE_LOCAL_FOLDER,
        ),
        "s3_bucket": _config_value(setting, SystemSettingConfigKey.STORAGE_S3_BUCKET),
        "s3_region": _config_value(setting, SystemSettingConfigKey.STORAGE_S3_REGION),
        "s3_endpoint_url": _config_value(
            setting,
            SystemSettingConfigKey.STORAGE_S3_ENDPOINT_URL,
        ),
        "s3_base_prefix": _config_value(
            setting,
            SystemSettingConfigKey.STORAGE_S3_BASE_PREFIX,
        ),
        "s3_use_path_style": _storage_config_bool(
            setting,
            SystemSettingConfigKey.STORAGE_S3_USE_PATH_STYLE,
        ),
        "s3_access_key_id": _config_value(
            setting,
            SystemSettingConfigKey.STORAGE_S3_ACCESS_KEY_ID,
        ),
        "s3_secret_access_key_set": bool(
            _secret_value(setting, SystemSettingSecretKey.STORAGE_S3_SECRET_ACCESS_KEY),
        ),
        "is_complete": is_complete,
        "is_verified": bool(setting.is_verified and setting.verified_at),
        "is_ready": is_system_storage_settings_ready(setting),
        "storage_verified_at": setting.verified_at,
        "storage_last_tested_at": setting.last_tested_at,
        "storage_last_test_error": setting.last_test_error,
        "created_at": setting.created_at,
        "updated_at": setting.updated_at,
    }


def mark_system_storage_test_result(
    db: Session,
    success: bool,
    error_message: str | None = None,
) -> SystemSetting:
    setting = get_or_create_storage_system_setting(db)
    tested_at = datetime.now(timezone.utc)
    setting.last_tested_at = tested_at
    setting.last_test_error = None if success else error_message
    setting.is_verified = success
    setting.verified_at = tested_at if success else None
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def test_system_storage_settings(db: Session) -> SystemSetting:
    setting = get_or_create_storage_system_setting(db)
    if not is_system_storage_settings_complete(setting):
        return mark_system_storage_test_result(
            db,
            success=False,
            error_message="Storage settings are incomplete.",
        )

    provider = _config_value(setting, SystemSettingConfigKey.STORAGE_PROVIDER)
    if provider == STORAGE_PROVIDER_LOCAL_MOUNT:
        local_folder = _config_value(setting, SystemSettingConfigKey.STORAGE_LOCAL_FOLDER)
        try:
            target = _safe_local_storage_path(str(local_folder))
            test_dir = target / ".leasemate-storage-test"
            test_dir.mkdir(parents=True, exist_ok=True)
            test_file = test_dir / f"{uuid.uuid4()}.txt"
            test_file.write_text("LeaseMate storage test", encoding="utf-8")
            content = test_file.read_text(encoding="utf-8")
            test_file.unlink(missing_ok=True)
            if content != "LeaseMate storage test":
                raise ValueError("Storage read/write test returned unexpected content.")
        except Exception as exc:
            return mark_system_storage_test_result(
                db,
                success=False,
                error_message=f"Local storage test failed: {exc}",
            )

        return mark_system_storage_test_result(db, success=True)

    if provider == STORAGE_PROVIDER_S3:
        return mark_system_storage_test_result(
            db,
            success=False,
            error_message=(
                "S3 settings were saved, but S3 verification is not wired yet. "
                "Install and connect the S3 storage adapter before verifying S3."
            ),
        )

    return mark_system_storage_test_result(
        db,
        success=False,
        error_message="Unknown storage provider.",
    )


def update_system_email_settings(
    db: Session,
    payload: SystemEmailSettingsUpdate,
) -> SystemSetting:
    setting = get_or_create_email_system_setting(db)
    data = payload.model_dump()
    config = dict(setting.config or {})
    secret_config = dict(setting.secret_config or {})
    noreply_user = data["noreply_user"] or None
    system_user = data["system_user"] or None
    noreply_from = str(data["noreply_from"]) if data["noreply_from"] else noreply_user
    system_from = str(data["system_from"]) if data["system_from"] else system_user

    config[_key(SystemSettingConfigKey.SMTP_HOST)] = data["smtp_host"] or None
    config[_key(SystemSettingConfigKey.SMTP_PORT)] = data["smtp_port"]
    config[_key(SystemSettingConfigKey.SMTP_USE_TLS)] = data["smtp_use_tls"]
    config[_key(SystemSettingConfigKey.NOREPLY_USER_NAME)] = noreply_user
    config[_key(SystemSettingConfigKey.NOREPLY_FROM_ADDRESS)] = noreply_from
    config[_key(SystemSettingConfigKey.SYSTEM_USER_NAME)] = system_user
    config[_key(SystemSettingConfigKey.SYSTEM_FROM_ADDRESS)] = system_from

    if data["clear_noreply_password"]:
        secret_config.pop(_key(SystemSettingSecretKey.NOREPLY_PASSWORD), None)
    elif data["noreply_password"]:
        secret_config[_key(SystemSettingSecretKey.NOREPLY_PASSWORD)] = data[
            "noreply_password"
        ]

    if data["clear_system_password"]:
        secret_config.pop(_key(SystemSettingSecretKey.SYSTEM_PASSWORD), None)
    elif data["system_password"]:
        secret_config[_key(SystemSettingSecretKey.SYSTEM_PASSWORD)] = data[
            "system_password"
        ]

    setting.config = config
    setting.secret_config = secret_config
    _clear_email_identity_verification(config)
    setting.is_verified = False
    setting.verified_at = None
    setting.verification_token = None
    setting.verification_sent_at = None
    setting.verification_expires_at = None
    setting.last_test_error = None

    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def _base_smtp_ready(setting: SystemSetting) -> bool:
    return bool(
        _config_value(setting, SystemSettingConfigKey.SMTP_HOST)
        and _config_value(setting, SystemSettingConfigKey.SMTP_PORT)
    )


def is_noreply_email_configured(setting: SystemSetting) -> bool:
    return bool(
        _base_smtp_ready(setting)
        and _config_value(setting, SystemSettingConfigKey.NOREPLY_USER_NAME)
        and _secret_value(setting, SystemSettingSecretKey.NOREPLY_PASSWORD)
        and _config_value(setting, SystemSettingConfigKey.NOREPLY_FROM_ADDRESS)
    )


def is_system_email_configured(setting: SystemSetting) -> bool:
    return bool(
        _base_smtp_ready(setting)
        and _config_value(setting, SystemSettingConfigKey.SYSTEM_USER_NAME)
        and _secret_value(setting, SystemSettingSecretKey.SYSTEM_PASSWORD)
        and _config_value(setting, SystemSettingConfigKey.SYSTEM_FROM_ADDRESS)
    )


def is_system_email_settings_complete(setting: SystemSetting) -> bool:
    return is_noreply_email_configured(setting) and is_system_email_configured(setting)


def is_system_email_settings_verified(setting: SystemSetting) -> bool:
    return bool(
        setting.is_verified
        and setting.verified_at
        and all(
            _email_identity_verified_at(setting, identity)
            for identity in EMAIL_SETTING_IDENTITIES
        )
    )


def is_system_email_settings_ready(setting: SystemSetting) -> bool:
    return is_system_email_settings_complete(setting) and is_system_email_settings_verified(setting)


def get_system_email_settings_status(db: Session) -> dict:
    setting = get_or_create_email_system_setting(db)
    return {
        "smtp_host_set": bool(_config_value(setting, SystemSettingConfigKey.SMTP_HOST)),
        "noreply_configured": is_noreply_email_configured(setting),
        "system_configured": is_system_email_configured(setting),
        "is_complete": is_system_email_settings_complete(setting),
        "is_verified": is_system_email_settings_verified(setting),
        "is_ready": is_system_email_settings_ready(setting),
        "smtp_verified_at": setting.verified_at,
        "smtp_verification_sent_at": setting.verification_sent_at,
        "smtp_verification_expires_at": setting.verification_expires_at,
        "smtp_last_tested_at": setting.last_tested_at,
        "smtp_last_test_error": setting.last_test_error,
    }


def to_system_email_settings_read(setting: SystemSetting) -> dict:
    is_complete = is_system_email_settings_complete(setting)
    is_verified = is_system_email_settings_verified(setting)
    return {
        "id": setting.id,
        "smtp_host": _config_value(setting, SystemSettingConfigKey.SMTP_HOST),
        "smtp_port": _config_value(setting, SystemSettingConfigKey.SMTP_PORT),
        "smtp_use_tls": _config_value(setting, SystemSettingConfigKey.SMTP_USE_TLS),
        "noreply_user": _config_value(
            setting,
            SystemSettingConfigKey.NOREPLY_USER_NAME,
        ),
        "noreply_from": _config_value(
            setting,
            SystemSettingConfigKey.NOREPLY_FROM_ADDRESS,
        ),
        "noreply_password_set": bool(
            _secret_value(setting, SystemSettingSecretKey.NOREPLY_PASSWORD)
        ),
        "system_user": _config_value(
            setting,
            SystemSettingConfigKey.SYSTEM_USER_NAME,
        ),
        "system_from": _config_value(
            setting,
            SystemSettingConfigKey.SYSTEM_FROM_ADDRESS,
        ),
        "system_password_set": bool(
            _secret_value(setting, SystemSettingSecretKey.SYSTEM_PASSWORD)
        ),
        "is_complete": is_complete,
        "is_verified": is_verified,
        "is_ready": is_complete and is_verified,
        "smtp_verified_at": setting.verified_at,
        "smtp_verification_sent_at": setting.verification_sent_at,
        "smtp_verification_expires_at": setting.verification_expires_at,
        "smtp_last_tested_at": setting.last_tested_at,
        "smtp_last_test_error": setting.last_test_error,
        "created_at": setting.created_at,
        "updated_at": setting.updated_at,
    }


def mark_system_email_test_result(
    db: Session,
    success: bool,
    error_message: str | None = None,
) -> SystemSetting:
    setting = get_or_create_email_system_setting(db)
    tested_at = datetime.now(timezone.utc)
    setting.last_tested_at = tested_at
    setting.last_test_error = None if success else error_message
    if not success:
        config = dict(setting.config or {})
        _clear_email_identity_verification(config)
        setting.config = config
        setting.is_verified = False
        setting.verified_at = None
        setting.verification_token = None
        setting.verification_sent_at = None
        setting.verification_expires_at = None
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def start_system_email_settings_verification(db: Session) -> SystemSetting:
    setting = get_or_create_email_system_setting(db)
    sent_at = datetime.now(timezone.utc)
    expires_at = sent_at + timedelta(hours=SETTING_VERIFICATION_TOKEN_HOURS)
    config = dict(setting.config or {})
    for identity in EMAIL_SETTING_IDENTITIES:
        config[_key(_email_identity_config_key(identity, "VERIFIED_AT"))] = None
        config[_key(_email_identity_config_key(identity, "VERIFICATION_TOKEN"))] = (
            secrets.token_urlsafe(48)
        )
        config[_key(_email_identity_config_key(identity, "VERIFICATION_SENT_AT"))] = (
            _datetime_to_config(sent_at)
        )
        config[_key(_email_identity_config_key(identity, "VERIFICATION_EXPIRES_AT"))] = (
            _datetime_to_config(expires_at)
        )
    setting.config = config
    setting.is_verified = False
    setting.verified_at = None
    setting.verification_token = None
    setting.verification_sent_at = sent_at
    setting.verification_expires_at = expires_at
    setting.last_tested_at = sent_at
    setting.last_test_error = None
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def confirm_system_email_settings_token(
    db: Session,
    token: str,
) -> SystemSetting | None:
    setting = (
        db.query(SystemSetting)
        .filter(SystemSetting.setting_key == _key(SystemSettingKey.EMAIL))
        .first()
    )
    if not setting:
        return None

    now = datetime.now(timezone.utc)
    matched_identity = None
    config = dict(setting.config or {})
    for identity in EMAIL_SETTING_IDENTITIES:
        identity_token = config.get(
            _key(_email_identity_config_key(identity, "VERIFICATION_TOKEN")),
        )
        if identity_token == token:
            matched_identity = identity
            break

    if not matched_identity:
        return None

    expires_at = _datetime_from_config(
        config.get(
            _key(
                _email_identity_config_key(
                    matched_identity,
                    "VERIFICATION_EXPIRES_AT",
                ),
            ),
        ),
    )
    if not expires_at:
        return None

    if expires_at < now:
        for field in ("VERIFICATION_TOKEN", "VERIFICATION_EXPIRES_AT"):
            config[_key(_email_identity_config_key(matched_identity, field))] = None
        setting.config = config
        _set_aggregate_email_verification_state(setting)
        db.add(setting)
        db.commit()
        return None

    config[_key(_email_identity_config_key(matched_identity, "VERIFIED_AT"))] = (
        _datetime_to_config(now)
    )
    config[_key(_email_identity_config_key(matched_identity, "VERIFICATION_TOKEN"))] = None
    setting.config = config
    _set_aggregate_email_verification_state(setting)
    if setting.is_verified:
        setting.verification_token = None
        setting.verification_sent_at = None
        setting.verification_expires_at = None
    setting.last_test_error = None
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def get_smtp_config(db: Session | None = None, identity: str = "noreply") -> SmtpConfig:
    setting = get_or_create_email_system_setting(db) if db else None

    host = _config_value(setting, SystemSettingConfigKey.SMTP_HOST) if setting else None
    port = (
        int(_config_value(setting, SystemSettingConfigKey.SMTP_PORT, 587))
        if setting
        else 587
    )
    use_tls = (
        bool(_config_value(setting, SystemSettingConfigKey.SMTP_USE_TLS, True))
        if setting
        else True
    )

    if identity == "system":
        return SmtpConfig(
            host=host,
            port=port,
            use_tls=use_tls,
            user=(
                _config_value(setting, SystemSettingConfigKey.SYSTEM_USER_NAME)
                if setting
                else None
            ),
            password=(
                _secret_value(setting, SystemSettingSecretKey.SYSTEM_PASSWORD)
                if setting
                else None
            ),
            from_address=(
                _config_value(setting, SystemSettingConfigKey.SYSTEM_FROM_ADDRESS, "")
                if setting
                else ""
            ),
        )

    return SmtpConfig(
        host=host,
        port=port,
        use_tls=use_tls,
        user=(
            _config_value(setting, SystemSettingConfigKey.NOREPLY_USER_NAME)
            if setting
            else None
        ),
        password=(
            _secret_value(setting, SystemSettingSecretKey.NOREPLY_PASSWORD)
            if setting
            else None
        ),
        from_address=(
            _config_value(setting, SystemSettingConfigKey.NOREPLY_FROM_ADDRESS, "")
            if setting
            else ""
        ),
    )
