import { useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import {
  ThemeContext,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeContext";

const THEME_STORAGE_KEY = "leasemate.themePreference";
const AUTO_DARK_START_HOUR = 18;
const AUTO_DARK_END_HOUR = 6;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "auto";
}

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : "light";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "auto") {
    return preference;
  }

  const currentHour = new Date().getHours();
  return currentHour >= AUTO_DARK_START_HOUR || currentHour < AUTO_DARK_END_HOUR
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(getStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredPreference()),
  );

  useEffect(() => {
    const updateResolvedTheme = () => {
      setResolvedTheme(resolveTheme(preference));
    };

    updateResolvedTheme();
    if (preference !== "auto") {
      return undefined;
    }

    const intervalId = window.setInterval(updateResolvedTheme, 60_000);
    return () => window.clearInterval(intervalId);
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference: (nextPreference: ThemePreference) => {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
        setPreferenceState(nextPreference);
      },
    }),
    [preference, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
