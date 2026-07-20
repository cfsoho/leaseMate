export type BootstrapStatus = {
  admin_exists: boolean;
  bootstrap_required: boolean;
};

export type SystemSetupStatus = {
  email_settings_ready: boolean;
  system_ready: boolean;
};

export type BootstrapAdminResponse = {
  user_id: string;
  email: string;
  status: string;
  email_sent: boolean;
  verification_token_expires_at: string;
  verification_url: string;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type BootstrapLocale = {
  code: string;
  name: string;
  native_name?: string | null;
  name_order?: "GIVEN_FAMILY" | "FAMILY_GIVEN";
  name_format_mask?: string;
};

export type BootstrapDefaultLocale = {
  locale_code: string;
  country_alpha2?: string | null;
};

export type ProfileCountry = {
  id: string;
  code: string;
  alpha2: string;
  name: string;
  native_name?: string | null;
  phone_prefix?: string | null;
  mobile_phone_format?: string | null;
  landline_phone_format?: string | null;
  default_locale_code?: string | null;
};

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type ThemePreference = "light" | "dark" | "auto";

export type PasskeyOptionsResponse = {
  options: Record<string, unknown>;
};

export type UserPasskey = {
  id: string;
  name?: string | null;
  device_type?: string | null;
  backed_up: boolean;
  transports?: string | null;
  is_active: boolean;
  last_used_at?: string | null;
  created_at: string;
};

export type UserLoginSession = {
  id: string;
  device_info?: string | null;
  ip_address?: string | null;
  location_country_code?: string | null;
  location_region?: string | null;
  location_city?: string | null;
  expires_at: string;
  revoked_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
  is_current: boolean;
  is_online: boolean;
  session_status: "online" | "idle" | "offline";
};

export type SessionActionResponse = {
  message?: string;
  revoked_count?: number;
};

export type EmailConfirmationResponse = AuthTokenResponse & {
  user: CurrentUser;
};

export type CurrentUser = {
  id: string;
  email: string;
  email_verified_at?: string | null;
  password_must_change: boolean;
  family_name: string;
  given_name: string;
  phone?: string | null;
  phone_country_id?: string | null;
  role_id?: string | null;
  role_code?: string | null;
  preferred_locale_code?: string | null;
  theme_preference?: ThemePreference | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type CurrentUserReadiness = {
  legal_name_count: number;
  property_count: number;
  financial_account_count: number;
};

export type EmailVerificationResendResponse = {
  already_verified: boolean;
  email_sent: boolean;
  verification_token_expires_at?: string | null;
  verification_url?: string | null;
};

export type ForgotPasswordResponse = {
  email_sent: boolean;
  password_reset_token_expires_at?: string | null;
  reset_url?: string | null;
  message: string;
};

export type PasswordResetTokenStatus = {
  valid: boolean;
  status: string;
  email?: string | null;
};

export type ResetPasswordResponse = {
  password_reset: boolean;
  message: string;
};

export type UserLegalName = {
  id: string;
  user_id: string;
  country_id: string;
  locale_code: string;
  full_name: string;
  created_at: string;
  updated_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type UserLegalNamePayload = {
  country_id: string;
  locale_code: string;
  full_name: string;
};
