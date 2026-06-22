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
import {
  DEFAULT_PAGE_ACCESS,
  type PageAccessSettings,
  type PageId,
} from "@/lib/page-access";
import { PageNoticeToast } from "./PageNoticeToast";

type PageAccessContextValue = {
  settings: PageAccessSettings;
  loaded: boolean;
  showNotice: (message: string) => void;
  isPageEnabled: (pageId: PageId) => boolean;
};

const PageAccessContext = createContext<PageAccessContextValue | null>(null);

export function PageAccessProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PageAccessSettings>(DEFAULT_PAGE_ACCESS);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pages/access")
      .then((r) => r.json())
      .then((data) => {
        if (data.pages) setSettings(data.pages);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const showNotice = useCallback((message: string) => {
    const text = message.trim() || "این بخش در حال حاضر در دسترس نیست.";
    setNotice(text);
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({
      settings,
      loaded,
      showNotice,
      isPageEnabled: (pageId: PageId) => settings[pageId]?.enabled !== false,
    }),
    [settings, loaded, showNotice]
  );

  return (
    <PageAccessContext.Provider value={value}>
      {children}
      <PageNoticeToast message={notice} onDismiss={dismissNotice} />
    </PageAccessContext.Provider>
  );
}

export function usePageAccess() {
  const ctx = useContext(PageAccessContext);
  if (!ctx) {
    throw new Error("usePageAccess must be used within PageAccessProvider");
  }
  return ctx;
}
