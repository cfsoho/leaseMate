import { apiRequest } from "../../lib/api/client";
import type { UserLegalName, UserLegalNamePayload } from "../auth/authTypes";

export function listUserLegalNames(userId: string) {
  return apiRequest<UserLegalName[]>(
    `/user-legal-names?user_id=${encodeURIComponent(userId)}&limit=1000`,
    {
      auth: true,
    },
  );
}

export function createUserLegalName(
  userId: string,
  payload: UserLegalNamePayload,
) {
  return apiRequest<UserLegalName>("/user-legal-names", {
    auth: true,
    method: "POST",
    body: {
      ...payload,
      user_id: userId,
    },
  });
}

export function updateUserLegalName(
  id: string,
  payload: UserLegalNamePayload,
) {
  return apiRequest<UserLegalName>(`/user-legal-names/${id}`, {
    auth: true,
    method: "PUT",
    body: payload,
  });
}

export function deleteUserLegalName(id: string) {
  return apiRequest<{ message: string }>(`/user-legal-names/${id}`, {
    auth: true,
    method: "DELETE",
  });
}
