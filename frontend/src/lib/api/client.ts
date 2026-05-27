import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "../auth/tokenStorage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

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
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
    clearTokens();
    return false;
  }

  const response = await sendRequest("/user-auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
    skipAuthRefresh: true,
  });

  if (!response.ok) {
    clearTokens();
    return false;
  }

  const payload = (await response.json()) as {
    access_token?: string;
  };

  if (!payload.access_token) {
    clearTokens();
    return false;
  }

  setAccessToken(payload.access_token);
  return true;
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
