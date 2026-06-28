"use client";

import { Suspense, type ReactNode } from "react";
import type { PageId } from "@/lib/page-access";
import { PageAccessGuard } from "./PageAccessGuard";
import { ProductTourProvider } from "./ProductTourProvider";
import { TabBottomNav, TabShellFallback, TabShellSuspense } from "./TabShellChrome";

export function PublicPageShellClient({
  pageId,
  children,
  showNav = true,
  tourReady = true,
  tourHasMatches = true,
}: {
  pageId: PageId;
  children: ReactNode;
  showNav?: boolean;
  tourReady?: boolean;
  tourHasMatches?: boolean;
}) {
  return (
    <ProductTourProvider
      pageId={pageId}
      tourReady={tourReady}
      hasMatches={tourHasMatches}
    >
      <PageAccessGuard pageId={pageId}>
        <Suspense fallback={<TabShellFallback showNav={showNav}>{children}</TabShellFallback>}>
          <TabShellSuspense showNav={showNav}>{children}</TabShellSuspense>
        </Suspense>
      </PageAccessGuard>
      <Suspense fallback={null}>
        <TabBottomNav showNav={showNav} />
      </Suspense>
    </ProductTourProvider>
  );
}
