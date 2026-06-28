"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type TabPageMeta = {
  tourReady: boolean;
  tourHasMatches: boolean;
};

const DEFAULT_META: TabPageMeta = {
  tourReady: false,
  tourHasMatches: true,
};

type TabPageMetaContextValue = {
  meta: TabPageMeta;
  setMeta: (patch: Partial<TabPageMeta>) => void;
  resetMeta: () => void;
};

const TabPageMetaContext = createContext<TabPageMetaContextValue | null>(null);

export function TabPageMetaProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [meta, setMetaState] = useState<TabPageMeta>(DEFAULT_META);

  const setMeta = useCallback((patch: Partial<TabPageMeta>) => {
    setMetaState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetMeta = useCallback(() => {
    setMetaState(DEFAULT_META);
  }, []);

  useEffect(() => {
    resetMeta();
  }, [pathname, resetMeta]);

  const value = useMemo(
    () => ({ meta, setMeta, resetMeta }),
    [meta, setMeta, resetMeta]
  );

  return (
    <TabPageMetaContext.Provider value={value}>{children}</TabPageMetaContext.Provider>
  );
}

export function useTabPageMeta() {
  const ctx = useContext(TabPageMetaContext);
  if (!ctx) {
    throw new Error("useTabPageMeta must be used within TabPageMetaProvider");
  }
  return ctx.meta;
}

export function useSetTabPageMeta(patch: Partial<TabPageMeta>) {
  const ctx = useContext(TabPageMetaContext);
  if (!ctx) return;

  const { setMeta } = ctx;
  useEffect(() => {
    setMeta(patch);
  }, [patch.tourReady, patch.tourHasMatches, setMeta]);
}
