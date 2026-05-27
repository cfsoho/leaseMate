import { apiRequest } from "../../lib/api/client";
import type { CurrentUser } from "../auth/authTypes";

export type Role = {
  id: string;
  code: string;
};

export type ActiveEmailLink = {
  id: string;
  user_id: string;
  family_name: string;
  given_name: string;
  email: string;
  preferred_locale_code?: string | null;
  expires_at: string;
  created_at?: string | null;
};

export type EmailLinkDashboardStats = {
  active_link_count: number;
  attention_required_count: number;
  expiring_today_count: number;
};

export type UserPage = {
  items: CurrentUser[];
  total: number;
  page: number;
  page_size: number;
};

export type UserLoginSession = {
  id: string;
  user_id: string;
  device_info?: string | null;
  ip_address?: string | null;
  created_at?: string | null;
  last_used_at?: string | null;
  expires_at: string;
  revoked_at?: string | null;
};

export type UserListParams = {
  page: number;
  pageSize: number;
  email?: string;
  familyName?: string;
  givenName?: string;
  phone?: string;
  preferredLocaleCode?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type CreateUserPayload = {
  family_name: string;
  given_name: string;
  email: string;
  password?: string | null;
  phone?: string | null;
  phone_country_id?: string | null;
  role_id?: string | null;
  preferred_locale_code?: string | null;
};

export type UpdateUserPayload = Omit<CreateUserPayload, "password" | "role_id"> & {
  status?: string | null;
};

export function listUsers(params: UserListParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
    sort_by: params.sortBy ?? "created_at",
    sort_direction: params.sortDirection ?? "asc",
  });
  appendSearchParam(searchParams, "family_name", params.familyName);
  appendSearchParam(searchParams, "given_name", params.givenName);
  appendSearchParam(searchParams, "email", params.email);
  appendSearchParam(searchParams, "phone", params.phone);
  appendSearchParam(
    searchParams,
    "preferred_locale_code",
    params.preferredLocaleCode,
  );

  return apiRequest<UserPage>(`/users?${searchParams.toString()}`, {
    auth: true,
  });
}

export function listUserLoginSessions(userId: string) {
  return apiRequest<UserLoginSession[]>(`/users/${userId}/login-sessions`, {
    auth: true,
  });
}

function appendSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value?: string,
) {
  const trimmedValue = value?.trim();

  if (trimmedValue) {
    searchParams.set(key, trimmedValue);
  }
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<CurrentUser>("/users", {
    auth: true,
    method: "POST",
    body: payload,
  });
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return apiRequest<CurrentUser>(`/users/${id}`, {
    auth: true,
    method: "PUT",
    body: payload,
  });
}

export function deactivateUser(id: string) {
  return apiRequest<CurrentUser>(`/users/${id}/deactivate`, {
    auth: true,
    method: "PATCH",
  });
}

export function activateUser(id: string) {
  return apiRequest<CurrentUser>(`/users/${id}/activate`, {
    auth: true,
    method: "PATCH",
  });
}

export function deleteUser(id: string) {
  return apiRequest<{ message: string }>(`/users/${id}`, {
    auth: true,
    method: "DELETE",
  });
}

export function listRoles() {
  return apiRequest<Role[]>("/roles", {
    auth: true,
  });
}

export function listActiveEmailLinks() {
  return apiRequest<ActiveEmailLink[]>("/users/email-links/active", {
    auth: true,
  });
}

export function getEmailLinkDashboardStats() {
  return apiRequest<EmailLinkDashboardStats>("/users/email-links/stats", {
    auth: true,
  });
}

export function expireEmailLink(id: string) {
  return apiRequest<{ message: string }>(`/users/email-links/${id}/expire`, {
    auth: true,
    method: "PATCH",
  });
}

export function resendEmailLink(id: string) {
  return apiRequest<{
    already_verified: boolean;
    email_sent: boolean;
    verification_token_expires_at?: string | null;
    verification_url?: string | null;
  }>("/user-auth/email-confirmation/resend", {
    auth: true,
    body: { token_id: id },
    method: "POST",
  });
}

export function sendUserVerificationEmail(userId: string) {
  return apiRequest<{
    already_verified: boolean;
    email_sent: boolean;
    verification_token_expires_at?: string | null;
    verification_url?: string | null;
  }>("/user-auth/email-confirmation/resend", {
    auth: true,
    body: { user_id: userId },
    method: "POST",
  });
}
