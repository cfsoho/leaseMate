import type { TranslationKey } from "../i18n/translations";

type Translate = (key: TranslationKey) => string;

export function formatDeviceTitle(
  userAgent: string | null | undefined,
  t: Translate,
) {
  if (!userAgent) {
    return t("security.browserSession");
  }

  const browser = getBrowserName(userAgent);
  const platform = getPlatformName(userAgent);

  if (browser && platform) {
    return `${browser} on ${platform}`;
  }

  return browser || platform || t("security.browserSession");
}

export function isMobileDevice(userAgent: string | null | undefined) {
  return Boolean(userAgent && /iPhone|iPad|Android|Mobile/i.test(userAgent));
}

function getBrowserName(userAgent: string) {
  if (/Edg\//.test(userAgent)) {
    return "Microsoft Edge";
  }
  if (/CriOS\//.test(userAgent)) {
    return "Chrome";
  }
  if (/Chrome\//.test(userAgent) && !/Chromium\//.test(userAgent)) {
    return "Chrome";
  }
  if (/Firefox\//.test(userAgent) || /FxiOS\//.test(userAgent)) {
    return "Firefox";
  }
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return "Safari";
  }

  return "";
}

function getPlatformName(userAgent: string) {
  if (/iPhone/.test(userAgent)) {
    return "iPhone";
  }
  if (/iPad/.test(userAgent)) {
    return "iPad";
  }
  if (/Macintosh/.test(userAgent)) {
    return "Mac";
  }
  if (/Android/.test(userAgent)) {
    return "Android";
  }
  if (/Windows/.test(userAgent)) {
    return "Windows";
  }
  if (/Linux/.test(userAgent)) {
    return "Linux";
  }

  return "";
}
