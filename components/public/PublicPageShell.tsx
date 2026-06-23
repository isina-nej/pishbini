import { Suspense, type ReactNode } from "react";
import type { PageId } from "@/lib/page-access";
import { PublicPageShellClient } from "./PublicPageShellClient";

export function PublicPageShell({
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
    <Suspense
      fallback={
        <div className={`min-h-dvh bg-bg${showNav ? " pb-32" : ""}`}>{children}</div>
      }
    >
      <PublicPageShellClient
        pageId={pageId}
        showNav={showNav}
        tourReady={tourReady}
        tourHasMatches={tourHasMatches}
      >
        {children}
      </PublicPageShellClient>
    </Suspense>
  );
}
