import {
  Building2,
  FileText,
  Home,
  ListTree,
  MailCheck,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";

import type { TranslationKey } from "../../lib/i18n/translations";

export const mainNavItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: Home },
  { labelKey: "nav.properties", href: "/properties", icon: Building2 },
  { labelKey: "nav.leases", href: "/leases", icon: FileText },
  { labelKey: "nav.expenses", href: "/expenses", icon: ReceiptText },
  { labelKey: "nav.documents", href: "/documents", icon: FileText },
] satisfies NavItem[];

export const adminNavItems = [
  { labelKey: "nav.users", href: "/users", icon: Users },
  { labelKey: "nav.emailLinks", href: "/email-links", icon: MailCheck },
  { labelKey: "nav.settings", href: "/settings", icon: Settings },
] satisfies NavItem[];

export const referenceNavItem = {
  labelKey: "nav.refData",
  href: "/setup-lists",
  icon: ListTree,
} satisfies NavItem;

export const referenceNavItems = [
  { labelKey: "nav.ref.countries", href: "/setup-lists/countries", icon: ListTree },
  { labelKey: "nav.ref.locales", href: "/setup-lists/locales", icon: ListTree },
  { labelKey: "nav.ref.regions", href: "/setup-lists/regions", icon: ListTree },
  { labelKey: "nav.ref.roles", href: "/setup-lists/roles", icon: ListTree },
  { labelKey: "nav.ref.statusCodes", href: "/setup-lists/status-codes", icon: ListTree },
  { labelKey: "nav.ref.referenceCodes", href: "/setup-lists/reference-codes", icon: ListTree },
  { labelKey: "nav.ref.propertyAccessLevels", href: "/setup-lists/property-access-levels", icon: ListTree },
  { labelKey: "nav.ref.expenseTypes", href: "/setup-lists/expense-types", icon: ListTree },
  { labelKey: "nav.ref.utilityTypes", href: "/setup-lists/utility-types", icon: ListTree },
  { labelKey: "nav.ref.contractorTypes", href: "/setup-lists/contractor-types", icon: ListTree },
  { labelKey: "nav.ref.documentTypes", href: "/setup-lists/document-types", icon: ListTree },
  { labelKey: "nav.ref.financialInstitutions", href: "/setup-lists/financial-institutions", icon: ListTree },
  { labelKey: "nav.ref.financialInstitutionBranches", href: "/setup-lists/financial-institution-branches", icon: ListTree },
] satisfies NavItem[];

export type NavItem = {
  labelKey: TranslationKey;
  href: string;
  icon: typeof Home;
};
