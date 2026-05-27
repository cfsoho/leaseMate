import {
  Building2,
  FileText,
  Home,
  Landmark,
  ListTree,
  MailCheck,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";

import type { TranslationKey } from "../../lib/i18n/translations";

export const mainNavItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: Home },
  { labelKey: "nav.bankAccounts", childLabelKey: "bankAccounts.transactions", href: "/bank-accounts", icon: Landmark },
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
  { labelKey: "nav.ref.financialInstitutions", childLabelKey: "nav.ref.financialInstitutionBranches", href: "/setup-lists/financial-institutions", icon: ListTree },
  { labelKey: "nav.ref.referenceCodes", href: "/setup-lists/reference-codes", icon: ListTree },
  { labelKey: "nav.ref.contractorTypes", childLabelKey: "nav.ref.translations", href: "/setup-lists/contractor-types", icon: ListTree },
  { labelKey: "nav.ref.countries", href: "/setup-lists/countries", icon: ListTree },
  { labelKey: "nav.ref.documentTypes", childLabelKey: "nav.ref.translations", href: "/setup-lists/document-types", icon: ListTree },
  { labelKey: "nav.ref.expenseTypes", childLabelKey: "nav.ref.translations", href: "/setup-lists/expense-types", icon: ListTree },
  { labelKey: "nav.ref.locales", href: "/setup-lists/locales", icon: ListTree },
  { labelKey: "nav.ref.propertyAccessLevels", childLabelKey: "nav.ref.translations", href: "/setup-lists/property-access-levels", icon: ListTree },
  { labelKey: "nav.ref.regions", href: "/setup-lists/regions", icon: ListTree },
  { labelKey: "nav.ref.statusCodes", childLabelKey: "nav.ref.translations", href: "/setup-lists/status-codes", icon: ListTree },
  { labelKey: "nav.ref.utilityTypes", childLabelKey: "nav.ref.translations", href: "/setup-lists/utility-types", icon: ListTree },
] satisfies ReferenceNavItem[];

export type NavItem = {
  labelKey: TranslationKey;
  childLabelKey?: TranslationKey;
  href: string;
  icon: typeof Home;
};

export type ReferenceNavItem = NavItem;
