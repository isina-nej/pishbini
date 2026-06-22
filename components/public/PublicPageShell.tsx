"use client";

import type { ReactNode } from "react";
import type { PageId } from "@/lib/page-access";
import { BottomNav } from "./BottomNav";
import { PageAccessGuard } from "./PageAccessGuard";
import { PageAccessProvider } from "./PageAccessProvider";
import { ReferralBanner } from "./ReferralBanner";

export function PublicPageShell({
  pageId,
  children,
  showNav = true,
}: {
  pageId: PageId;
  children: ReactNode;
  showNav?: boolean;
}) {
  return (
    <PageAccessProvider>
      <PageAccessGuard pageId={pageId}>
        <ReferralBanner />
        {children}
      </PageAccessGuard>
      {showNav && <BottomNav />}
    </PageAccessProvider>
  );
}
