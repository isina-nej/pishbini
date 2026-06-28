"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTabCache, setTabCache, stableFingerprint } from "@/lib/tab-data-cache";
import { useTabRefreshState } from "@/lib/tab-refresh-context";

type UseTabDataOptions<T> = {
  enabled?: boolean;
  fingerprint?: (data: T) => string;
};

type UseTabDataResult<T> = {
  data: T | undefined;
  error: string | null;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  reload: () => void;
};

export function useTabData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseTabDataOptions<T> = {}
): UseTabDataResult<T> {
  const { enabled = true, fingerprint = stableFingerprint } = options;
  const { setRefreshing } = useTabRefreshState();

  const cached = enabled ? getTabCache<T>(key) : undefined;
  const [data, setData] = useState<T | undefined>(cached?.data);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(!cached);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  const fingerprintRef = useRef(fingerprint);
  fetcherRef.current = fetcher;
  fingerprintRef.current = fingerprint;

  const runFetch = useCallback(
    async (hasCached: boolean) => {
      if (!enabled) return;

      if (hasCached) {
        setIsRefreshing(true);
        setRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }

      try {
        const next = await fetcherRef.current();
        const nextFp = fingerprintRef.current(next);
        const prevFp = getTabCache<T>(key)?.fingerprint;

        setTabCache(key, next, nextFp);
        setError(null);

        if (!hasCached || prevFp !== nextFp) {
          setData(next);
        }
      } catch {
        if (!hasCached) {
          setError("خطا در دریافت اطلاعات");
        }
      } finally {
        setIsInitialLoad(false);
        setIsRefreshing(false);
        setRefreshing(false);
      }
    },
    [enabled, key, setRefreshing]
  );

  const reload = useCallback(async () => {
    await runFetch(Boolean(getTabCache<T>(key)));
  }, [key, runFetch]);

  useEffect(() => {
    if (!enabled) return;

    const entry = getTabCache<T>(key);
    if (entry) {
      setData(entry.data);
      setIsInitialLoad(false);
      void runFetch(true);
      return;
    }

    void runFetch(false);
  }, [enabled, key, runFetch]);

  return { data, error, isInitialLoad, isRefreshing, reload };
}
