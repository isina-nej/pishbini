"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TabPageMetaProvider, useTabPageMeta } from "@/lib/tab-page-meta";
import { TabRefreshProvider } from "@/lib/tab-refresh-context";
import { PageAccessGuard } from "./PageAccessGuard";
import { ProductTourProvider } from "./ProductTourProvider";
import {
  TabBottomNav,
  TabShellSuspense,
  resolveTabPageId,
} from "./TabShellChrome";
import { TabRefreshBar } from "./TabRefreshBar";

function TabsLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageId = resolveTabPageId(pathname);
  const { tourReady, tourHasMatches } = useTabPageMeta();

  return (
    <ProductTourProvider
      pageId={pageId}
      tourReady={tourReady}
      hasMatches={tourHasMatches}
    >
      <PageAccessGuard pageId={pageId}>
        <TabRefreshBar />
        <TabShellSuspense showNav>{children}</TabShellSuspense>
      </PageAccessGuard>
      <Suspense fallback={null}>
        <TabBottomNav showNav />
      </Suspense>
    </ProductTourProvider>
  );
}

export function TabsLayoutClient({ children }: { children: ReactNode }) {
  return (
    <TabRefreshProvider>
      <TabPageMetaProvider>
        <TabsLayoutInner>{children}</TabsLayoutInner>
      </TabPageMetaProvider>
    </TabRefreshProvider>
  );
}
