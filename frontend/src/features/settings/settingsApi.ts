import { apiRequest } from "../../lib/api/client";

export type SystemEmailSettings = {
  id: string;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_use_tls?: boolean | null;
  noreply_user?: string | null;
  noreply_from?: string | null;
  noreply_password_set: boolean;
  system_user?: string | null;
  system_from?: string | null;
  system_password_set: boolean;
  is_complete: boolean;
  is_verified: boolean;
  is_ready: boolean;
  smtp_verified_at?: string | null;
  smtp_verification_sent_at?: string | null;
  smtp_verification_expires_at?: string | null;
  smtp_last_tested_at?: string | null;
  smtp_last_test_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SystemEmailSettingsStatus = {
  smtp_host_set: boolean;
  noreply_configured: boolean;
  system_configured: boolean;
  is_complete: boolean;
  is_verified: boolean;
  is_ready: boolean;
  smtp_verified_at?: string | null;
  smtp_verification_sent_at?: string | null;
  smtp_verification_expires_at?: string | null;
  smtp_last_tested_at?: string | null;
  smtp_last_test_error?: string | null;
};

export type SystemEmailSettingsUpdate = {
  smtp_host?: string | null;
  smtp_port: number;
  smtp_use_tls: boolean;
  noreply_user?: string | null;
  noreply_password?: string | null;
  noreply_from?: string | null;
  clear_noreply_password: boolean;
  system_user?: string | null;
  system_password?: string | null;
  system_from?: string | null;
  clear_system_password: boolean;
};

export type StorageProvider = "LOCAL_MOUNT" | "S3";

export type SystemStorageSettings = {
  id: string;
  provider?: StorageProvider | null;
  local_folder?: string | null;
  s3_bucket?: string | null;
  s3_region?: string | null;
  s3_endpoint_url?: string | null;
  s3_base_prefix?: string | null;
  s3_use_path_style?: boolean | null;
  s3_access_key_id?: string | null;
  s3_secret_access_key_set: boolean;
  is_complete: boolean;
  is_verified: boolean;
  is_ready: boolean;
  storage_verified_at?: string | null;
  storage_last_tested_at?: string | null;
  storage_last_test_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SystemStorageSettingsUpdate = {
  provider: StorageProvider;
  local_folder?: string | null;
  s3_bucket?: string | null;
  s3_region?: string | null;
  s3_endpoint_url?: string | null;
  s3_base_prefix?: string | null;
  s3_use_path_style: boolean;
  s3_access_key_id?: string | null;
  s3_secret_access_key?: string | null;
  clear_s3_secret_access_key: boolean;
};

export function getSystemEmailSettings() {
  return apiRequest<SystemEmailSettings>("/system-settings/email", {
    auth: true,
  });
}

export function updateSystemEmailSettings(payload: SystemEmailSettingsUpdate) {
  return apiRequest<SystemEmailSettings>("/system-settings/email", {
    auth: true,
    body: payload,
    method: "PUT",
  });
}

export function getSystemEmailSettingsStatus() {
  return apiRequest<SystemEmailSettingsStatus>("/system-settings/email/status", {
    auth: true,
  });
}

export function testSystemEmailSettings() {
  return apiRequest<{
    success: boolean;
    is_ready: boolean;
    smtp_verified_at?: string | null;
    smtp_verification_sent_at?: string | null;
    smtp_verification_expires_at?: string | null;
    smtp_last_test_error?: string | null;
  }>("/system-settings/email/test", {
    auth: true,
    method: "POST",
  });
}

export function verifySystemEmailSettings(token: string) {
  return apiRequest<{
    success: boolean;
    is_ready: boolean;
    smtp_verified_at?: string | null;
    smtp_verification_sent_at?: string | null;
    smtp_verification_expires_at?: string | null;
    smtp_last_test_error?: string | null;
  }>(`/system-settings/email/verify/${encodeURIComponent(token)}`);
}

export function getSystemStorageSettings() {
  return apiRequest<SystemStorageSettings>("/system-settings/storage", {
    auth: true,
  });
}

export function updateSystemStorageSettings(payload: SystemStorageSettingsUpdate) {
  return apiRequest<SystemStorageSettings>("/system-settings/storage", {
    auth: true,
    body: payload,
    method: "PUT",
  });
}

export function testSystemStorageSettings() {
  return apiRequest<{
    success: boolean;
    is_ready: boolean;
    storage_verified_at?: string | null;
    storage_last_tested_at?: string | null;
    storage_last_test_error?: string | null;
  }>("/system-settings/storage/test", {
    auth: true,
    method: "POST",
  });
}
