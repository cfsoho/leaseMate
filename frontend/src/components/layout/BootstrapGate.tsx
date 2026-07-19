import { useQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getBootstrapStatus } from "../../features/auth/authApi";
import { getAccessToken } from "../../lib/auth/tokenStorage";

export function BootstrapGate({ children }: PropsWithChildren) {
  const location = useLocation();
  const bootstrapStatus = useQuery({
    queryKey: ["bootstrap-status"],
    queryFn: getBootstrapStatus,
    staleTime: Infinity,
  });

  if (bootstrapStatus.isLoading) {
    return <BootstrapSpinner />;
  }

  if (bootstrapStatus.data?.bootstrap_required) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/bootstrap-admin"
      />
    );
  }

  if (!getAccessToken()) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}

export function BootstrapRedirectGate({ children }: PropsWithChildren) {
  const location = useLocation();
  const bootstrapStatus = useQuery({
    queryKey: ["bootstrap-status"],
    queryFn: getBootstrapStatus,
    staleTime: Infinity,
  });

  if (bootstrapStatus.isLoading) {
    return <BootstrapSpinner />;
  }

  if (bootstrapStatus.data?.bootstrap_required) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/bootstrap-admin"
      />
    );
  }

  return children;
}

function BootstrapSpinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <span
        aria-label="Checking setup status"
        className="size-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950"
        role="status"
      />
    </main>
  );
}
