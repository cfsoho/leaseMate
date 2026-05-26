import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { LocaleProvider } from "../lib/i18n/LocaleProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </LocaleProvider>
  );
}
