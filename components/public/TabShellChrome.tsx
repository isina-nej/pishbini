"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { PageId } from "@/lib/page-access";
import { hrefToPageId } from "@/lib/page-access.shared";
import {
  getNavTransitionType,
  getTabNavIndex,
  navigateTab,
} from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import { BottomNav, useVisibleNavHrefs } from "./BottomNav";
import { ReferralBanner } from "./ReferralBanner";
import { TabViewTransition } from "./TabViewTransition";

const SWIPE_MIN_PX = 48;
const SWIPE_RATIO = 1.4;
const SWIPE_COMMIT_RATIO = 0.22;

export function TabShellChrome({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) {
  const embed = useSearchParams().get("embed") === "1";

  if (embed) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <>
      <ReferralBanner />
      {showNav ? (
        <SwipeTabNav>
          <TabViewTransition>{children}</TabViewTransition>
        </SwipeTabNav>
      ) : (
        <TabViewTransition>{children}</TabViewTransition>
      )}
    </>
  );
}

export function TabBottomNav({ showNav = true }: { showNav?: boolean }) {
  const embed = useSearchParams().get("embed") === "1";
  if (!showNav || embed) return null;
  return <BottomNav />;
}

export function TabShellFallback({
  children,
  showNav,
}: {
  children: ReactNode;
  showNav: boolean;
}) {
  return <div className={cn("min-h-dvh", showNav && "pb-32")}>{children}</div>;
}

function SwipeTabNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const visibleHrefs = useVisibleNavHrefs();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ x: 0, y: 0, locked: false });
  const dragXRef = useRef(0);
  const widthRef = useRef(0);
  const navigatingRef = useRef(false);

  const currentPageId = hrefToPageId(pathname);
  const currentIndex = getTabNavIndex(pathname, visibleHrefs);

  const prevHref = currentIndex > 0 ? visibleHrefs[currentIndex - 1] : null;
  const nextHref =
    currentIndex >= 0 && currentIndex < visibleHrefs.length - 1
      ? visibleHrefs[currentIndex + 1]
      : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      widthRef.current = el.clientWidth;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    navigatingRef.current = false;
  }, [pathname]);

  const commitSwipe = useCallback(
    (href: string | null, targetIndex: number) => {
      if (!href || navigatingRef.current) return;
      navigatingRef.current = true;
      const transitionType = getNavTransitionType(currentIndex, targetIndex);
      navigateTab(router, href, transitionType, reduceMotion);
    },
    [currentIndex, reduceMotion, router]
  );

  if (!currentPageId || reduceMotion || currentIndex === -1) {
    return <>{children}</>;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (navigatingRef.current) return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, locked: false };
    dragXRef.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (navigatingRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (!touchRef.current.locked) {
      if (Math.abs(dx) < 10) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
      touchRef.current.locked = true;
    }

    dragXRef.current = dx;
  };

  const onTouchEnd = () => {
    if (!touchRef.current.locked) return;
    touchRef.current.locked = false;

    const width = widthRef.current;
    const threshold = Math.max(
      SWIPE_MIN_PX,
      width > 0 ? width * SWIPE_COMMIT_RATIO : SWIPE_MIN_PX
    );

    const dx = dragXRef.current;
    dragXRef.current = 0;

    if (dx > threshold && nextHref) {
      commitSwipe(nextHref, currentIndex + 1);
      return;
    }
    if (dx < -threshold && prevHref) {
      commitSwipe(prevHref, currentIndex - 1);
      return;
    }
  };

  const onTouchCancel = () => {
    touchRef.current.locked = false;
    dragXRef.current = 0;
  };

  return (
    <div
      ref={containerRef}
      className="touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {children}
    </div>
  );
}

export function TabShellSuspense({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) {
  return (
    <Suspense fallback={<TabShellFallback showNav={showNav}>{children}</TabShellFallback>}>
      <TabShellChrome showNav={showNav}>{children}</TabShellChrome>
    </Suspense>
  );
}

export function resolveTabPageId(pathname: string): PageId {
  return hrefToPageId(pathname) ?? "predictions";
}
