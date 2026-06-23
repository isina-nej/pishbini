"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { PageId } from "@/lib/page-access";
import { hrefToPageId } from "@/lib/page-access.shared";
import { cn } from "@/lib/utils";
import { BottomNav, useVisibleNavHrefs } from "./BottomNav";
import { PageAccessGuard } from "./PageAccessGuard";
import { PageAccessProvider } from "./PageAccessProvider";
import { ProductTourProvider } from "./ProductTourProvider";
import { ReferralBanner } from "./ReferralBanner";

const SWIPE_MIN_PX = 48;
const SWIPE_RATIO = 1.4;
const SWIPE_COMMIT_RATIO = 0.22;
const SWIPE_MS = 240;

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
    <PageAccessProvider>
      <ProductTourProvider
        pageId={pageId}
        tourReady={tourReady}
        hasMatches={tourHasMatches}
      >
        <PageAccessGuard pageId={pageId}>
          <Suspense fallback={<ShellFallback showNav={showNav}>{children}</ShellFallback>}>
            <ShellBody pageId={pageId} showNav={showNav}>
              {children}
            </ShellBody>
          </Suspense>
        </PageAccessGuard>
        <Suspense fallback={null}>
          <BottomNavUnlessEmbed showNav={showNav} />
        </Suspense>
      </ProductTourProvider>
    </PageAccessProvider>
  );
}

function ShellFallback({
  children,
  showNav,
}: {
  children: ReactNode;
  showNav: boolean;
}) {
  return <div className={cn("min-h-dvh bg-bg", showNav && "pb-32")}>{children}</div>;
}

function BottomNavUnlessEmbed({ showNav }: { showNav: boolean }) {
  const embed = useSearchParams().get("embed") === "1";
  if (!showNav || embed) return null;
  return <BottomNav />;
}

function ShellBody({
  pageId,
  children,
  showNav,
}: {
  pageId?: PageId;
  children: ReactNode;
  showNav: boolean;
}) {
  const embed = useSearchParams().get("embed") === "1";

  if (embed) {
    return <div className="min-h-dvh bg-bg">{children}</div>;
  }

  return (
    <>
      <ReferralBanner />
      {showNav ? <SwipeTabNav>{children}</SwipeTabNav> : children}
    </>
  );
}

function embedHref(href: string) {
  return href.includes("?") ? `${href}&embed=1` : `${href}?embed=1`;
}

function AdjacentTab({
  href,
  style,
}: {
  href: string;
  style: CSSProperties;
}) {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-bg"
      style={style}
      aria-hidden
    >
      <iframe
        src={embedHref(href)}
        className="pointer-events-none h-full w-full border-0"
        title=""
        tabIndex={-1}
        loading="lazy"
      />
    </div>
  );
}

function SwipeTabNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const visibleHrefs = useVisibleNavHrefs();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ x: 0, y: 0, locked: false });
  const dragXRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  const currentPageId = hrefToPageId(pathname);
  const currentIndex =
    pathname === "/login"
      ? visibleHrefs.indexOf("/profile")
      : visibleHrefs.indexOf(pathname);

  const prevHref =
    currentIndex > 0 ? visibleHrefs[currentIndex - 1] : null;
  const nextHref =
    currentIndex >= 0 && currentIndex < visibleHrefs.length - 1
      ? visibleHrefs[currentIndex + 1]
      : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    dragXRef.current = 0;
    setDragX(0);
    setDragging(false);
    setAnimating(false);
  }, [pathname]);

  useEffect(() => {
    if (currentIndex === -1) return;
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [currentIndex, nextHref, prevHref, router]);

  const clampDrag = useCallback(
    (dx: number) => {
      if (currentIndex <= 0 && dx < 0) return dx * 0.28;
      if (currentIndex >= visibleHrefs.length - 1 && dx > 0) return dx * 0.28;
      return dx;
    },
    [currentIndex, visibleHrefs.length]
  );

  const finishSwipe = useCallback(
    (targetX: number, href: string | null) => {
      if (!href || width <= 0) {
        setAnimating(true);
        dragXRef.current = 0;
        setDragX(0);
        window.setTimeout(() => setAnimating(false), SWIPE_MS);
        return;
      }
      setAnimating(true);
      dragXRef.current = targetX;
      setDragX(targetX);
      window.setTimeout(() => {
        router.push(href);
        dragXRef.current = 0;
        setDragX(0);
        setAnimating(false);
      }, SWIPE_MS);
    },
    [router, width]
  );

  if (!currentPageId || reduceMotion || currentIndex === -1) {
    return <>{children}</>;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (animating) return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, locked: false };
    setDragging(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (animating) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (!touchRef.current.locked) {
      if (Math.abs(dx) < 10) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
      touchRef.current.locked = true;
      setDragging(true);
    }

    e.preventDefault();
    const next = clampDrag(dx);
    dragXRef.current = next;
    setDragX(next);
  };

  const onTouchEnd = () => {
    if (!touchRef.current.locked) return;
    touchRef.current.locked = false;
    setDragging(false);

    const threshold = Math.max(
      SWIPE_MIN_PX,
      width > 0 ? width * SWIPE_COMMIT_RATIO : SWIPE_MIN_PX
    );

    const dx = dragXRef.current;
    if (dx > threshold && nextHref) {
      finishSwipe(width, nextHref);
      return;
    }
    if (dx < -threshold && prevHref) {
      finishSwipe(-width, prevHref);
      return;
    }
    finishSwipe(0, null);
  };

  const onTouchCancel = () => {
    touchRef.current.locked = false;
    setDragging(false);
    finishSwipe(0, null);
  };

  const slideStyle = (x: number): CSSProperties => ({
    transform: `translate3d(${x}px, 0, 0)`,
    transition:
      dragging || !animating
        ? "none"
        : `transform ${SWIPE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    willChange: dragging || animating ? "transform" : "auto",
  });

  const showNext = !!nextHref && dragX > 6;
  const showPrev = !!prevHref && dragX < -6;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {showNext && (
        <AdjacentTab
          href={nextHref}
          style={slideStyle(dragX - width)}
        />
      )}
      {showPrev && (
        <AdjacentTab
          href={prevHref}
          style={slideStyle(dragX + width)}
        />
      )}

      <div
        className="relative z-10 min-h-dvh bg-bg"
        style={slideStyle(dragX)}
      >
        {children}
      </div>
    </div>
  );
}
