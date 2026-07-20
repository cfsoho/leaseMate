import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { RouteLocaleProvider } from "./RouteLocaleProvider";
import { AppLayout } from "../components/layout/AppLayout";
import {
  BootstrapGate,
  BootstrapRedirectGate,
} from "../components/layout/BootstrapGate";
import { ForcedLightTheme } from "../lib/theme/ForcedLightTheme";

type UnderConstructionPageProps = {
  titleKey: string;
};

function lazyNamed<TProps = Record<string, never>>(
  loader: () => Promise<unknown>,
  exportName: string,
) {
  return lazy(async () => {
    const module = (await loader()) as Record<string, ComponentType<TProps>>;

    return {
      default: module[exportName],
    };
  });
}

const BankAccountsPage = lazyNamed(
  () => import("../pages/BankAccountsPage"),
  "BankAccountsPage",
);
const BootstrapAdminPage = lazyNamed(
  () => import("../pages/BootstrapAdminPage"),
  "BootstrapAdminPage",
);
const DashboardPage = lazyNamed(
  () => import("../pages/DashboardPage"),
  "DashboardPage",
);
const DevicesPage = lazyNamed(
  () => import("../pages/DevicesPage"),
  "DevicesPage",
);
const EmailConfirmationPage = lazyNamed(
  () => import("../pages/EmailConfirmationPage"),
  "EmailConfirmationPage",
);
const EmailLinksPage = lazyNamed(
  () => import("../pages/EmailLinksPage"),
  "EmailLinksPage",
);
const ExpensesPage = lazyNamed(
  () => import("../pages/ExpensesPage"),
  "ExpensesPage",
);
const ForgotPasswordPage = lazyNamed(
  () => import("../pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const LoginPage = lazyNamed(() => import("../pages/LoginPage"), "LoginPage");
const NotFoundPage = lazyNamed(
  () => import("../pages/NotFoundPage"),
  "NotFoundPage",
);
const ProfilePage = lazyNamed(
  () => import("../pages/ProfilePage"),
  "ProfilePage",
);
const ReferenceListsPage = lazyNamed(
  () => import("../pages/ReferenceListsPage"),
  "ReferenceListsPage",
);
const ResetPasswordPage = lazyNamed(
  () => import("../pages/ResetPasswordPage"),
  "ResetPasswordPage",
);
const SettingsPage = lazyNamed(
  () => import("../pages/SettingsPage"),
  "SettingsPage",
);
const SystemEmailVerificationPage = lazyNamed(
  () => import("../pages/SystemEmailVerificationPage"),
  "SystemEmailVerificationPage",
);
const UnderConstructionPage = lazyNamed<UnderConstructionPageProps>(
  () => import("../pages/UnderConstructionPage"),
  "UnderConstructionPage",
);
const UsersPage = lazyNamed(() => import("../pages/UsersPage"), "UsersPage");
const UserDetailPage = lazyNamed(
  () => import("../pages/UserDetailPage"),
  "UserDetailPage",
);

function withRouteFallback(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[calc(100dvh-8rem)] place-items-center">
          <span
            aria-label="Loading"
            className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950"
            role="status"
          />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <BootstrapGate>
        <AppLayout />
      </BootstrapGate>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: withRouteFallback(<DashboardPage />) },
      {
        path: "bank-accounts",
        element: withRouteFallback(<BankAccountsPage />),
      },
      {
        path: "properties",
        element: withRouteFallback(
          <UnderConstructionPage titleKey="nav.properties" />,
        ),
      },
      {
        path: "leases",
        element: withRouteFallback(
          <UnderConstructionPage titleKey="nav.leases" />,
        ),
      },
      { path: "expenses", element: withRouteFallback(<ExpensesPage />) },
      {
        path: "documents",
        element: withRouteFallback(
          <UnderConstructionPage titleKey="nav.documents" />,
        ),
      },
      { path: "profile", element: withRouteFallback(<ProfilePage />) },
      { path: "devices", element: withRouteFallback(<DevicesPage />) },
      {
        path: "setup-lists",
        element: withRouteFallback(<ReferenceListsPage />),
      },
      {
        path: "setup-lists/:listSlug",
        element: withRouteFallback(<ReferenceListsPage />),
      },
      { path: "users", element: withRouteFallback(<UsersPage />) },
      {
        path: "users/create",
        element: withRouteFallback(<UserDetailPage />),
      },
      { path: "users/:userId", element: withRouteFallback(<UserDetailPage />) },
      { path: "email-links", element: withRouteFallback(<EmailLinksPage />) },
      { path: "settings", element: withRouteFallback(<SettingsPage />) },
      { path: "*", element: withRouteFallback(<NotFoundPage />) },
    ],
  },
  {
    path: "/bootstrap-admin",
    element: withRouteFallback(
      <ForcedLightTheme>
        <RouteLocaleProvider>
          <BootstrapAdminPage />
        </RouteLocaleProvider>
      </ForcedLightTheme>,
    ),
  },
  {
    path: "/login",
    element: withRouteFallback(
      <ForcedLightTheme>
        <BootstrapRedirectGate>
          <LoginPage />
        </BootstrapRedirectGate>
      </ForcedLightTheme>,
    ),
  },
  {
    path: "/forgot-password",
    element: withRouteFallback(
      <ForcedLightTheme>
        <BootstrapRedirectGate>
          <RouteLocaleProvider>
            <ForgotPasswordPage />
          </RouteLocaleProvider>
        </BootstrapRedirectGate>
      </ForcedLightTheme>,
    ),
  },
  {
    path: "/reset-password/:token",
    element: withRouteFallback(
      <ForcedLightTheme>
        <BootstrapRedirectGate>
          <RouteLocaleProvider>
            <ResetPasswordPage />
          </RouteLocaleProvider>
        </BootstrapRedirectGate>
      </ForcedLightTheme>,
    ),
  },
  {
    path: "/confirm-email/:token",
    element: withRouteFallback(
      <ForcedLightTheme>
        <BootstrapRedirectGate>
          <RouteLocaleProvider>
            <EmailConfirmationPage />
          </RouteLocaleProvider>
        </BootstrapRedirectGate>
      </ForcedLightTheme>,
    ),
  },
  {
    path: "/settings/email/verify/:token",
    element: withRouteFallback(
      <ForcedLightTheme>
        <RouteLocaleProvider>
          <SystemEmailVerificationPage />
        </RouteLocaleProvider>
      </ForcedLightTheme>,
    ),
  },
  { path: "*", element: withRouteFallback(<NotFoundPage />) },
]);
