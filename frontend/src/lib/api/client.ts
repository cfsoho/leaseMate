import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "../auth/tokenStorage";
import { setAuthRedirectReason } from "../../features/auth/authUiTransition";
import { clearStoredLocale } from "../i18n/LocaleProvider";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const API_ACTIVITY_EVENT = "leasemate:api-activity";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
  skipAuthRefresh?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await sendRequest(path, options);

  if (
    response.status === 401 &&
    options.auth &&
    !options.skipAuthRefresh &&
    (await refreshAccessToken())
  ) {
    return apiRequest<T>(path, {
      ...options,
      skipAuthRefresh: true,
    });
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    notifyApiActivity(options);
    return undefined as T;
  }

  notifyApiActivity(options);
  return response.json() as Promise<T>;
}

function notifyApiActivity(options: ApiRequestOptions) {
  if (options.auth && typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_ACTIVITY_EVENT));
  }
}

async function sendRequest(
  path: string,
  options: ApiRequestOptions = {},
) {
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    expireSession();
    return false;
  }

  const response = await sendRequest("/user-auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
    skipAuthRefresh: true,
  });

  if (!response.ok) {
    expireSession();
    return false;
  }

  const payload = (await response.json()) as {
    access_token?: string;
  };

  if (!payload.access_token) {
    expireSession();
    return false;
  }

  setAccessToken(payload.access_token);
  return true;
}

function expireSession() {
  setAuthRedirectReason("session_expired");
  clearStoredLocale();
  clearTokens();
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      const firstDetail = payload.detail.find(isValidationDetail);
      if (firstDetail) {
        const fieldPath = firstDetail.loc
          .filter((part) => part !== "body")
          .join(".");
        return fieldPath
          ? `${fieldPath}: ${firstDetail.msg}`
          : firstDetail.msg;
      }
    }
  } catch {
    // The backend should normally return JSON, but keep UI errors readable if not.
  }

  return `Request failed with status ${response.status}`;
}

function isValidationDetail(value: unknown): value is {
  loc: Array<string | number>;
  msg: string;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { loc?: unknown; msg?: unknown };
  return Array.isArray(candidate.loc) && typeof candidate.msg === "string";
}
