import { API_BASE_URL, apiRequest } from "../../lib/api/client";
import { getAccessToken } from "../../lib/auth/tokenStorage";

export type ReferenceListSlug =
  | "contractor-types"
  | "countries"
  | "document-types"
  | "expense-types"
  | "financial-institution-branches"
  | "financial-institutions"
  | "locales"
  | "property-access-levels"
  | "reference-codes"
  | "regions"
  | "roles"
  | "status-codes"
  | "utility-types";

type ReferenceApiConfig = {
  path: string;
  isCatalogList?: boolean;
  isLocalized?: boolean;
};

const referenceApiBySlug: Record<ReferenceListSlug, ReferenceApiConfig> = {
  "contractor-types": { path: "/contractor-types", isLocalized: true },
  countries: { path: "/countries" },
  "document-types": { path: "/document-types", isLocalized: true },
  "expense-types": { path: "/expense-types", isLocalized: true },
  "financial-institution-branches": { path: "/financial-institution-branches" },
  "financial-institutions": { path: "/financial-institutions" },
  locales: { path: "/locales" },
  "property-access-levels": { path: "/property-access-levels", isLocalized: true },
  "reference-codes": { path: "/ref-codes/catalogs", isCatalogList: true },
  regions: { path: "/regions" },
  roles: { path: "/roles" },
  "status-codes": { path: "/status-codes", isLocalized: true },
  "utility-types": { path: "/utility-types", isLocalized: true },
};

export type ReferenceRecord = {
  id: string;
  sharedId: string;
  code?: string | null;
  locale?: string | null;
  name: string;
  isActive?: boolean | null;
  raw: Record<string, unknown>;
};

const SETUP_LIST_FETCH_LIMIT = 10000;

export function isReferenceListSlug(value: string): value is ReferenceListSlug {
  return value in referenceApiBySlug;
}

export function isLocalizedReferenceListSlug(slug: ReferenceListSlug) {
  return Boolean(referenceApiBySlug[slug].isLocalized);
}

export async function listReferenceRecords(slug: ReferenceListSlug) {
  return listReferenceRecordsForLocale(slug, "en");
}

export async function listReferenceTranslations(
  slug: ReferenceListSlug,
  sharedId: string,
) {
  const config = referenceApiBySlug[slug];

  if (!config.isLocalized) {
    return [];
  }

  const payload = await apiRequest<unknown[]>(
    `/setup-list-translations/${slug}/${sharedId}`,
    { auth: true },
  );

  return (Array.isArray(payload) ? payload : []).map(normalizeReferenceRecord);
}

export async function downloadReferenceTranslationTemplate(
  slug: ReferenceListSlug,
  sharedId: string,
  fileName: string,
) {
  const token = getAccessToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_BASE_URL}/setup-list-translations/${slug}/${sharedId}/template.csv`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function uploadReferenceTranslations(
  slug: ReferenceListSlug,
  sharedId: string,
  rows: Record<string, string | boolean>[],
) {
  return apiRequest<{
    inserted_locales: string[];
    skipped_locales: string[];
  }>(`/setup-list-translations/${slug}/${sharedId}/upload`, {
    auth: true,
    body: { rows },
    method: "POST",
  });
}

export async function createReferenceRecord(
  slug: ReferenceListSlug,
  payload: Record<string, unknown>,
) {
  const config = referenceApiBySlug[slug];

  if (config.isCatalogList) {
    throw new Error("Catalog setup lists cannot be created from this view yet.");
  }

  return normalizeReferenceRecord(
    await apiRequest<unknown>(config.path, {
      auth: true,
      body: payload,
      method: "POST",
    }),
  );
}

export async function updateReferenceRecord(
  slug: ReferenceListSlug,
  record: ReferenceRecord,
  payload: Record<string, unknown>,
) {
  const config = referenceApiBySlug[slug];

  if (config.isCatalogList) {
    throw new Error("Catalog setup lists cannot be edited from this view yet.");
  }

  return normalizeReferenceRecord(
    await apiRequest<unknown>(buildUpdatePath(slug, config, record), {
      auth: true,
      body: payload,
      method: "PUT",
    }),
  );
}

export async function deleteReferenceRecord(
  slug: ReferenceListSlug,
  record: ReferenceRecord,
) {
  const config = referenceApiBySlug[slug];

  if (config.isCatalogList) {
    throw new Error("Catalog setup lists cannot be deleted from this view yet.");
  }

  await apiRequest<void>(buildRecordPath(slug, config, record), {
    auth: true,
    method: "DELETE",
  });
}

async function listReferenceRecordsForLocale(
  slug: ReferenceListSlug,
  locale?: string,
) {
  const config = referenceApiBySlug[slug];
  const separator = config.path.includes("?") ? "&" : "?";
  const query = new URLSearchParams({
    skip: "0",
    limit: String(SETUP_LIST_FETCH_LIMIT),
  });

  if (config.isLocalized && locale) {
    query.set("locale", locale);
  }

  const payload = await apiRequest<unknown>(
    config.isCatalogList
      ? config.path
      : `${config.path}${separator}${query.toString()}`,
    {
      auth: true,
    },
  );

  if (config.isCatalogList) {
    return ((Array.isArray(payload) ? payload : []) as string[]).map((catalog) => ({
      id: catalog,
      sharedId: catalog,
      code: catalog,
      locale: null,
      name: catalog,
      isActive: true,
      raw: { code: catalog, name: catalog },
    })) satisfies ReferenceRecord[];
  }

  return (Array.isArray(payload) ? payload : []).map(normalizeReferenceRecord);
}

function normalizeReferenceRecord(item: unknown): ReferenceRecord {
  const raw = isRecord(item) ? item : {};
  const sharedId =
    readString(raw.id) ||
    readString(raw.code) ||
    readString(raw.locale) ||
    crypto.randomUUID();
  const locale = readString(raw.locale);
  const id = locale ? `${sharedId}:${locale}` : sharedId;
  const code = readString(raw.code) || readString(raw.alpha2);
  const name =
    readString(raw.name) ||
    readString(raw.native_name) ||
    readString(raw.branch_name) ||
    readString(raw.code) ||
    id;
  const isActive =
    typeof raw.is_active === "boolean" ? raw.is_active : undefined;

  return {
    id,
    sharedId,
    code,
    locale,
    name,
    isActive,
    raw,
  };
}

function buildUpdatePath(
  slug: ReferenceListSlug,
  config: ReferenceApiConfig,
  record: ReferenceRecord,
) {
  if (config.isLocalized) {
    const locale = record.locale || readString(record.raw.locale);

    if (!locale) {
      throw new Error("A locale is required to edit this setup list row.");
    }

    return `${config.path}/${record.sharedId}/${encodeURIComponent(locale)}`;
  }

  if (slug === "locales") {
    return `${config.path}/${encodeURIComponent(record.sharedId)}`;
  }

  return `${config.path}/${record.sharedId}`;
}

function buildRecordPath(
  slug: ReferenceListSlug,
  config: ReferenceApiConfig,
  record: ReferenceRecord,
) {
  return buildUpdatePath(slug, config, record);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}
