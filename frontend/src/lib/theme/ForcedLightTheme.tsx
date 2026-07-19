import { useEffect, type PropsWithChildren } from "react";

import { setForcedTheme } from "./ThemeProvider";

export function ForcedLightTheme({ children }: PropsWithChildren) {
  useEffect(() => {
    const previousForcedTheme = document.documentElement.dataset.forceTheme;

    setForcedTheme("light");
    return () => {
      setForcedTheme(
        previousForcedTheme === "light" || previousForcedTheme === "dark"
          ? previousForcedTheme
          : null,
      );
    };
  }, []);

  return children;
}
