import {
  DEFAULT_PAGE_ACCESS,
  parsePageAccess,
  type PageAccessSettings,
} from "@/lib/page-access.shared";

const CACHE_KEY = "wc_page_access_v1";

export function readPageAccessCache(): PageAccessSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return parsePageAccess(raw);
  } catch {
    return null;
  }
}

export function writePageAccessCache(settings: PageAccessSettings): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveInitialPageAccess(
  serverSettings?: PageAccessSettings
): { settings: PageAccessSettings; hydrated: boolean } {
  if (serverSettings) {
    return { settings: serverSettings, hydrated: true };
  }
  const cached = readPageAccessCache();
  if (cached) {
    return { settings: cached, hydrated: true };
  }
  return { settings: DEFAULT_PAGE_ACCESS, hydrated: false };
}
