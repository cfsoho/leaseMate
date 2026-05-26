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
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <section className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-600">
          Checking setup status...
        </section>
      </main>
    );
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
