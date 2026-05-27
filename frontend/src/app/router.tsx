import { createBrowserRouter, Navigate } from "react-router-dom";

import { RouteLocaleProvider } from "./RouteLocaleProvider";
import { AppLayout } from "../components/layout/AppLayout";
import { BootstrapGate } from "../components/layout/BootstrapGate";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { BootstrapAdminPage } from "../pages/BootstrapAdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EmailConfirmationPage } from "../pages/EmailConfirmationPage";
import { EmailLinksPage } from "../pages/EmailLinksPage";
import { ExpensesPage } from "../pages/ExpensesPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ReferenceListsPage } from "../pages/ReferenceListsPage";
import { UnderConstructionPage } from "../pages/UnderConstructionPage";
import { UsersPage } from "../pages/UsersPage";

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
      { path: "dashboard", element: <DashboardPage /> },
      { path: "bank-accounts", element: <BankAccountsPage /> },
      {
        path: "properties",
        element: <UnderConstructionPage titleKey="nav.properties" />,
      },
      {
        path: "leases",
        element: <UnderConstructionPage titleKey="nav.leases" />,
      },
      { path: "expenses", element: <ExpensesPage /> },
      {
        path: "documents",
        element: <UnderConstructionPage titleKey="nav.documents" />,
      },
      { path: "profile", element: <ProfilePage /> },
      { path: "setup-lists", element: <ReferenceListsPage /> },
      { path: "setup-lists/:listSlug", element: <ReferenceListsPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "email-links", element: <EmailLinksPage /> },
      {
        path: "settings",
        element: <UnderConstructionPage titleKey="nav.settings" />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/bootstrap-admin",
    element: (
      <RouteLocaleProvider>
        <BootstrapAdminPage />
      </RouteLocaleProvider>
    ),
  },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/confirm-email/:token",
    element: (
      <RouteLocaleProvider>
        <EmailConfirmationPage />
      </RouteLocaleProvider>
    ),
  },
  { path: "*", element: <NotFoundPage /> },
]);
