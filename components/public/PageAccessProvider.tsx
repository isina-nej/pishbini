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
  isPageAccessible,
  type PageAccessSettings,
  type PageId,
} from "@/lib/page-access.shared";
import {
  resolveInitialPageAccess,
  writePageAccessCache,
} from "@/lib/page-access-cache";
import { PageNoticeToast } from "./PageNoticeToast";

type PageAccessContextValue = {
  settings: PageAccessSettings;
  loaded: boolean;
  showNotice: (message: string) => void;
  isPageEnabled: (pageId: PageId) => boolean;
  isPageVisible: (pageId: PageId) => boolean;
};

const PageAccessContext = createContext<PageAccessContextValue | null>(null);

export function PageAccessProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings?: PageAccessSettings;
}) {
  const initial = useMemo(
    () => resolveInitialPageAccess(initialSettings),
    [initialSettings]
  );
  const [settings, setSettings] = useState<PageAccessSettings>(initial.settings);
  const [loaded, setLoaded] = useState(initial.hydrated);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings) {
      writePageAccessCache(initialSettings);
    }
  }, [initialSettings]);

  useEffect(() => {
    fetch("/api/pages/access")
      .then((r) => r.json())
      .then((data) => {
        if (data.pages) {
          writePageAccessCache(data.pages);
          setSettings(data.pages);
        }
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
      isPageVisible: (pageId: PageId) =>
        isPageAccessible(settings[pageId] ?? DEFAULT_PAGE_ACCESS[pageId]),
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
