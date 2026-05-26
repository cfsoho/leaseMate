const ACCESS_TOKEN_KEY = "leasemate.accessToken";
const LAST_LOGIN_EMAIL_KEY = "leasemate.lastLoginEmail";
const REFRESH_TOKEN_KEY = "leasemate.refreshToken";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getLastLoginEmail() {
  return localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
}

export function setLastLoginEmail(email: string) {
  localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
}

export function clearLastLoginEmail() {
  localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
