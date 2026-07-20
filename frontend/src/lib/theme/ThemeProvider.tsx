import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { getCurrentUser, updateCurrentUser } from "../../features/auth/authApi";
import type { CurrentUser } from "../../features/auth/authTypes";
import { AUTH_TOKEN_CHANGE_EVENT, getAccessToken } from "../auth/tokenStorage";
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeContext";

const AUTO_DARK_START_HOUR = 18;
const AUTO_DARK_END_HOUR = 6;
const FORCE_THEME_EVENT = "leasemate:force-theme";

function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "auto";
}

function getForcedTheme(): ResolvedTheme | null {
  if (typeof document === "undefined") {
    return null;
  }

  const forcedTheme = document.documentElement.dataset.forceTheme;
  return forcedTheme === "light" || forcedTheme === "dark" ? forcedTheme : null;
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

function hasAccessToken() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(getAccessToken());
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [fallbackPreference, setFallbackPreference] =
    useState<ThemePreference>("light");
  const [optimisticPreference, setOptimisticPreference] =
    useState<ThemePreference | null>(null);
  const [forcedTheme, setForcedTheme] =
    useState<ResolvedTheme | null>(getForcedTheme);
  const [isAuthenticated, setIsAuthenticated] = useState(hasAccessToken);

  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 30_000,
  });

  const userPreference = currentUser.data?.theme_preference;
  const preference =
    optimisticPreference ??
    (isThemePreference(userPreference) ? userPreference : fallbackPreference);

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(preference),
  );
  const effectiveTheme = forcedTheme ?? resolvedTheme;

  const updateThemePreference = useMutation({
    mutationFn: (nextPreference: ThemePreference) =>
      updateCurrentUser({ theme_preference: nextPreference }),
    onMutate: async (nextPreference) => {
      await queryClient.cancelQueries({ queryKey: ["current-user"] });
      const previousUser =
        queryClient.getQueryData<CurrentUser>(["current-user"]);
      queryClient.setQueryData<CurrentUser | undefined>(
        ["current-user"],
        (oldUser) =>
          oldUser ? { ...oldUser, theme_preference: nextPreference } : oldUser,
      );
      return { previousUser };
    },
    onSuccess: (updatedUser, nextPreference) => {
      queryClient.setQueryData<CurrentUser>(["current-user"], {
        ...updatedUser,
        theme_preference: nextPreference,
      });
      setOptimisticPreference(null);
    },
    onError: (_error, _nextPreference, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["current-user"], context.previousUser);
      }
      setOptimisticPreference(null);
    },
  });

  useEffect(() => {
    const updateForcedTheme = () => setForcedTheme(getForcedTheme());

    window.addEventListener(FORCE_THEME_EVENT, updateForcedTheme);
    return () => window.removeEventListener(FORCE_THEME_EVENT, updateForcedTheme);
  }, []);

  useEffect(() => {
    const updateAuthenticationState = () => {
      const hasToken = hasAccessToken();
      setIsAuthenticated(hasToken);
      if (!hasToken) {
        setOptimisticPreference(null);
        queryClient.removeQueries({ queryKey: ["current-user"] });
      }
    };

    window.addEventListener(AUTH_TOKEN_CHANGE_EVENT, updateAuthenticationState);
    return () =>
      window.removeEventListener(AUTH_TOKEN_CHANGE_EVENT, updateAuthenticationState);
  }, [queryClient]);

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
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.style.colorScheme = effectiveTheme;
  }, [effectiveTheme]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme: effectiveTheme,
      setPreference: (nextPreference: ThemePreference) => {
        setFallbackPreference(nextPreference);
        setOptimisticPreference(nextPreference);
        if (hasAccessToken()) {
          updateThemePreference.mutate(nextPreference);
        }
      },
    }),
    [effectiveTheme, preference, updateThemePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function setForcedTheme(theme: ResolvedTheme | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (theme) {
    document.documentElement.dataset.forceTheme = theme;
  } else {
    delete document.documentElement.dataset.forceTheme;
  }

  window.dispatchEvent(new Event(FORCE_THEME_EVENT));
}
