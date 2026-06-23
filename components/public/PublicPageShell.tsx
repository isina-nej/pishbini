"use client";

import { useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { PageId } from "@/lib/page-access";
import { hrefToPageId } from "@/lib/page-access.shared";
import { BottomNav, useVisibleNavHrefs } from "./BottomNav";
import { PageAccessGuard } from "./PageAccessGuard";
import { PageAccessProvider } from "./PageAccessProvider";
import { ReferralBanner } from "./ReferralBanner";

const SWIPE_THRESHOLD = 60;
const SWIPE_RATIO = 1.5;

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
        {showNav ? (
          <SwipeTabNav>{children}</SwipeTabNav>
        ) : (
          children
        )}
      </PageAccessGuard>
      {showNav && <BottomNav />}
    </PageAccessProvider>
  );
}

function SwipeTabNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const visibleHrefs = useVisibleNavHrefs();
  const touchRef = useRef({ x: 0, y: 0, tracking: false });

  const currentPageId = hrefToPageId(pathname);
  if (!currentPageId || reduceMotion) {
    return <>{children}</>;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, tracking: true };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current.tracking) return;
    touchRef.current.tracking = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;

    const currentIndex = visibleHrefs.indexOf(pathname);
    if (currentIndex === -1) return;

    // RTL: swipe right (dx > 0) → next tab in array; swipe left → previous
    const nextIndex = dx > 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= visibleHrefs.length) return;

    router.push(visibleHrefs[nextIndex]);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
