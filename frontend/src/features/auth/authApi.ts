import { apiRequest } from "../../lib/api/client";
import type {
  AuthTokenResponse,
  BootstrapAdminResponse,
  BootstrapLocale,
  BootstrapStatus,
  CurrentUser,
  CurrentUserReadiness,
  EmailConfirmationResponse,
  EmailVerificationResendResponse,
  ProfileCountry,
  UserLegalName,
  UserLegalNamePayload,
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

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/user-auth/me", {
    auth: true,
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
