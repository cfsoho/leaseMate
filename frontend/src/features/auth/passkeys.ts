import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import {
  createPasskeyAuthenticationOptions,
  createPasskeyRegistrationOptions,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from "./authApi";

export const PASSKEY_PROMPT_AFTER_PASSWORD_LOGIN_KEY =
  "leasemate.promptPasskeyAfterPasswordLogin";

export function passkeysAreSupported() {
  return browserSupportsWebAuthn();
}

export async function authenticateWithPasskey(email?: string) {
  if (!passkeysAreSupported()) {
    return null;
  }

  const { options } = await createPasskeyAuthenticationOptions(email);
  const allowCredentials = options.allowCredentials;
  if (Array.isArray(allowCredentials) && allowCredentials.length === 0) {
    return null;
  }

  const credential = await startAuthentication({
    optionsJSON: options as never,
  });

  return verifyPasskeyAuthentication(credential);
}

export async function registerCurrentUserPasskey(name?: string) {
  if (!passkeysAreSupported()) {
    throw new Error("PASSKEY_UNSUPPORTED");
  }

  const { options } = await createPasskeyRegistrationOptions();
  const credential = await startRegistration({
    optionsJSON: options as never,
  });

  return verifyPasskeyRegistration(credential, name);
}
