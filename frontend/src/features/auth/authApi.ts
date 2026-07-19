import { apiRequest } from "../../lib/api/client";
import type {
  AuthTokenResponse,
  BootstrapAdminResponse,
  BootstrapDefaultLocale,
  BootstrapLocale,
  BootstrapStatus,
  CurrentUser,
  CurrentUserReadiness,
  EmailConfirmationResponse,
  EmailVerificationResendResponse,
  ForgotPasswordResponse,
  PasskeyOptionsResponse,
  PasswordResetTokenStatus,
  ProfileCountry,
  ResetPasswordResponse,
  SessionActionResponse,
  ThemePreference,
  UserLegalName,
  UserLegalNamePayload,
  UserLoginSession,
  UserPasskey,
} from "./authTypes";

export type BootstrapAdminPayload = {
  family_name: string;
  given_name: string;
  email: string;
  password: string;
  phone?: string | null;
  preferred_locale_code?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function getBootstrapStatus() {
  return apiRequest<BootstrapStatus>("/user-auth/bootstrap-status");
}

export function getBootstrapLocales() {
  return apiRequest<BootstrapLocale[]>("/user-auth/bootstrap-locales");
}

export function getBootstrapDefaultLocale() {
  return apiRequest<BootstrapDefaultLocale>("/user-auth/bootstrap-default-locale");
}

export function getProfileCountries() {
  return apiRequest<ProfileCountry[]>("/user-auth/profile-countries", {
    auth: true,
  });
}

export function bootstrapAdmin(payload: BootstrapAdminPayload) {
  return apiRequest<BootstrapAdminResponse>("/user-auth/bootstrap-admin", {
    method: "POST",
    body: payload,
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthTokenResponse>("/user-auth/login", {
    method: "POST",
    body: payload,
  });
}

export function logout(refreshToken: string) {
  return apiRequest<{ message: string }>("/user-auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function createPasskeyAuthenticationOptions(email?: string) {
  return apiRequest<PasskeyOptionsResponse>(
    "/user-auth/passkeys/authentication-options",
    {
      method: "POST",
      body: { email: email || null },
    },
  );
}

export function verifyPasskeyAuthentication(credential: unknown) {
  return apiRequest<AuthTokenResponse>("/user-auth/passkeys/authentication-verify", {
    method: "POST",
    body: { credential },
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<ForgotPasswordResponse>("/user-auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function getPasswordResetTokenStatus(token: string) {
  return apiRequest<PasswordResetTokenStatus>(
    `/user-auth/reset-password/${token}`,
  );
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<ResetPasswordResponse>("/user-auth/reset-password", {
    method: "POST",
    body: {
      token,
      new_password: newPassword,
    },
  });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/user-auth/me", {
    auth: true,
  });
}

export function getCurrentUserPasskeys() {
  return apiRequest<UserPasskey[]>("/user-auth/me/passkeys", {
    auth: true,
  });
}

export function createPasskeyRegistrationOptions() {
  return apiRequest<PasskeyOptionsResponse>(
    "/user-auth/me/passkeys/registration-options",
    {
      auth: true,
      method: "POST",
    },
  );
}

export function verifyPasskeyRegistration(credential: unknown, name?: string) {
  return apiRequest<UserPasskey>("/user-auth/me/passkeys/registration-verify", {
    auth: true,
    method: "POST",
    body: { credential, name: name || null },
  });
}

export function deleteCurrentUserPasskey(passkeyId: string) {
  return apiRequest<{ message: string }>(`/user-auth/me/passkeys/${passkeyId}`, {
    auth: true,
    method: "DELETE",
  });
}

export function getCurrentUserSessions() {
  return apiRequest<UserLoginSession[]>("/user-auth/me/sessions", {
    auth: true,
  });
}

export function revokeCurrentUserSession(sessionId: string) {
  return apiRequest<SessionActionResponse>(`/user-auth/me/sessions/${sessionId}`, {
    auth: true,
    method: "DELETE",
  });
}

export function logoutOtherSessions(refreshToken?: string | null) {
  return apiRequest<SessionActionResponse>("/user-auth/me/sessions/logout-others", {
    auth: true,
    method: "POST",
    body: { refresh_token: refreshToken || null },
  });
}

export function logoutAllSessions() {
  return apiRequest<SessionActionResponse>("/user-auth/me/sessions/logout-all", {
    auth: true,
    method: "POST",
  });
}

export function getCurrentUserReadiness() {
  return apiRequest<CurrentUserReadiness>("/user-auth/me/readiness", {
    auth: true,
  });
}

export function resendEmailVerification() {
  return apiRequest<EmailVerificationResendResponse>(
    "/user-auth/email-confirmation/resend",
    {
      auth: true,
      method: "POST",
    },
  );
}

export function confirmEmail(token: string) {
  return apiRequest<EmailConfirmationResponse>(`/user-auth/confirm-email/${token}`);
}

export type UpdateCurrentUserPayload = {
  email?: string;
  family_name?: string;
  given_name?: string;
  phone?: string | null;
  phone_country_id?: string | null;
  preferred_locale_code?: string | null;
  theme_preference?: ThemePreference;
};

export function updateCurrentUser(payload: UpdateCurrentUserPayload) {
  return apiRequest<CurrentUser>("/user-auth/me", {
    auth: true,
    method: "PATCH",
    body: payload,
  });
}

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export function changeCurrentUserPassword(
  userId: string,
  payload: ChangePasswordPayload,
) {
  return apiRequest<CurrentUser>(`/user-auth/users/${userId}/password`, {
    auth: true,
    method: "PATCH",
    body: payload,
  });
}

export function getCurrentUserLegalNames() {
  return apiRequest<UserLegalName[]>("/user-auth/me/legal-names", {
    auth: true,
  });
}

export function createCurrentUserLegalName(payload: UserLegalNamePayload) {
  return apiRequest<UserLegalName>("/user-auth/me/legal-names", {
    auth: true,
    method: "POST",
    body: payload,
  });
}

export function updateCurrentUserLegalName(
  id: string,
  payload: UserLegalNamePayload,
) {
  return apiRequest<UserLegalName>(`/user-auth/me/legal-names/${id}`, {
    auth: true,
    method: "PUT",
    body: payload,
  });
}

export function deleteCurrentUserLegalName(id: string) {
  return apiRequest<{ message: string }>(`/user-auth/me/legal-names/${id}`, {
    auth: true,
    method: "DELETE",
  });
}
