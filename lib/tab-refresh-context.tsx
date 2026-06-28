"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type TabRefreshContextValue = {
  refreshing: boolean;
  setRefreshing: (value: boolean) => void;
};

const TabRefreshContext = createContext<TabRefreshContextValue | null>(null);

export function TabRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const value = useMemo(
    () => ({ refreshing, setRefreshing }),
    [refreshing]
  );
  return (
    <TabRefreshContext.Provider value={value}>{children}</TabRefreshContext.Provider>
  );
}

export function useTabRefreshState() {
  const ctx = useContext(TabRefreshContext);
  if (!ctx) {
    return { refreshing: false, setRefreshing: () => {} };
  }
  return ctx;
}
