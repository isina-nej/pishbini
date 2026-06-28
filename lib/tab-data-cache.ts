export type TabCacheEntry<T> = {
  data: T;
  fingerprint: string;
  fetchedAt: number;
};

const CACHE_TTL_MS = 30_000;

const store = new Map<string, TabCacheEntry<unknown>>();

export function stableFingerprint(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(Date.now());
  }
}

export function fingerprintMatches(matches: unknown): string {
  if (!Array.isArray(matches)) return stableFingerprint(matches);
  return stableFingerprint(
    matches.map((m) => {
      if (m && typeof m === "object") {
        const row = m as Record<string, unknown>;
        return {
          id: row.id,
          startTime: row.startTime,
          stats: row.stats,
        };
      }
      return m;
    })
  );
}

export function getTabCache<T>(key: string): TabCacheEntry<T> | undefined {
  const entry = store.get(key) as TabCacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    return entry;
  }
  return entry;
}

export function setTabCache<T>(key: string, data: T, fingerprint: string) {
  store.set(key, { data, fingerprint, fetchedAt: Date.now() });
}

export function invalidateTabCache(key: string) {
  store.delete(key);
}

export function invalidateTabCachePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
