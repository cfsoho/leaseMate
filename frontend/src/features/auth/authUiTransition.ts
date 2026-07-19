export const LOGIN_TO_APP_TRANSITION_KEY = "leasemate.loginToAppTransition";
export const LOGOUT_TO_LOGIN_TRANSITION_KEY = "leasemate.logoutToLoginTransition";
export const LOGIN_EXIT_MS = 950;
export const APP_LOGOUT_EXIT_MS = 950;

const AUTH_REDIRECT_REASON_KEY = "leasemate.authRedirectReason";

export type AuthRedirectReason = "session_revoked" | "session_expired";

export function consumeTransitionFlag(key: string) {
  const shouldAnimate = sessionStorage.getItem(key) === "true";
  sessionStorage.removeItem(key);
  return shouldAnimate;
}

export function setAuthRedirectReason(reason: AuthRedirectReason) {
  sessionStorage.setItem(AUTH_REDIRECT_REASON_KEY, reason);
}

export function consumeAuthRedirectReason(): AuthRedirectReason | null {
  const reason = sessionStorage.getItem(AUTH_REDIRECT_REASON_KEY);
  sessionStorage.removeItem(AUTH_REDIRECT_REASON_KEY);

  return reason === "session_revoked" || reason === "session_expired"
    ? reason
    : null;
}

export function startAppLogoutTransition(afterExit: () => void) {
  sessionStorage.setItem(LOGOUT_TO_LOGIN_TRANSITION_KEY, "true");
  document.body.classList.add("app-logout-exit");
  window.setTimeout(() => {
    document.body.classList.remove("app-logout-exit");
    afterExit();
  }, APP_LOGOUT_EXIT_MS);
}
