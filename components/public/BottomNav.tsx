"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CircleUserRound,
  Gift,
  GitBranch,
  Medal,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_TAB_ORDER,
  PAGE_LABELS,
  PAGE_ROUTES,
  type PageId,
} from "@/lib/page-access.shared";
import {
  getNavTransitionType,
  getTabNavIndex,
  navigateTab,
} from "@/lib/tab-navigation";
import { usePageAccess } from "./PageAccessProvider";

const PAGE_ICONS: Record<PageId, LucideIcon> = {
  predictions: Target,
  bracket: GitBranch,
  leaderboard: Medal,
  prizes: Gift,
  profile: CircleUserRound,
};

const INDICATOR_SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };
const ICON_SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };

function NavTab({
  id,
  href,
  label,
  Icon,
  active,
  currentIndex,
  targetIndex,
  reduceMotion,
  onNavigate,
}: {
  id: PageId;
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  currentIndex: number;
  targetIndex: number;
  reduceMotion: boolean | null;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const transitionType = getNavTransitionType(currentIndex, targetIndex);

  return (
    <Link
      href={href}
      data-tour={`nav-${id}`}
      onClick={(e) => onNavigate(e, href)}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      transitionTypes={[transitionType]}
      className="relative flex min-h-11 min-w-[2.75rem] flex-1 flex-col items-center justify-center px-0.5 py-1"
    >
      {active && (
        <motion.div
          layoutId="bottom-nav-indicator"
          className="absolute inset-x-0 inset-y-0.5 rounded-2xl bg-primary/12 ring-1 ring-inset ring-primary/25"
          transition={reduceMotion ? { duration: 0 } : INDICATOR_SPRING}
        />
      )}

      {active && !reduceMotion && (
        <span
          className="bottom-nav-halo pointer-events-none absolute inset-0 -z-10 rounded-2xl"
          aria-hidden
        />
      )}

      <motion.span
        className="relative z-10 flex flex-col items-center gap-0.5"
        animate={reduceMotion ? undefined : { scale: active ? 1.12 : 1 }}
        transition={reduceMotion ? { duration: 0 } : ICON_SPRING}
      >
        <Icon
          className={cn(
            "size-[22px] transition-colors duration-200",
            active ? "text-primary" : "text-white/45"
          )}
          strokeWidth={active ? 2 : 1.75}
          fill={active ? "currentColor" : "none"}
          aria-hidden
        />
        {active && (
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="max-w-[4.5rem] truncate text-[10px] font-semibold leading-none text-primary"
          >
            {label}
          </motion.span>
        )}
      </motion.span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isPageVisible } = usePageAccess();

  const visibleTabs = NAV_TAB_ORDER.filter((id) => isPageVisible(id));
  const visibleHrefs = visibleTabs.map((id) => PAGE_ROUTES[id]);
  const currentIndex = getTabNavIndex(pathname, visibleHrefs);

  useEffect(() => {
    visibleHrefs.forEach((href) => router.prefetch(href));
  }, [visibleHrefs, router]);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href || (href === "/profile" && pathname === "/login")) {
      e.preventDefault();
      return;
    }

    const targetIndex = getTabNavIndex(href, visibleHrefs);
    if (targetIndex === -1 || currentIndex === -1) return;

    e.preventDefault();
    const transitionType = getNavTransitionType(currentIndex, targetIndex);
    navigateTab(router, href, transitionType, reduceMotion);
  };

  return (
    <motion.nav
      aria-label="ناوبری اصلی"
      className={cn(
        "bottom-nav-shell glass-pill fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2",
        "rounded-full px-1.5 py-1.5"
      )}
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-stretch justify-around">
        {visibleTabs.map((id, targetIndex) => {
          const href = PAGE_ROUTES[id];
          const label = PAGE_LABELS[id];
          const Icon = PAGE_ICONS[id];
          const active =
            pathname === href || (id === "profile" && pathname === "/login");

          return (
            <NavTab
              key={id}
              id={id}
              href={href}
              label={label}
              Icon={Icon}
              active={active}
              currentIndex={currentIndex}
              targetIndex={targetIndex}
              reduceMotion={reduceMotion}
              onNavigate={handleNavigate}
            />
          );
        })}
      </div>
    </motion.nav>
  );
}

export function useVisibleNavHrefs(): string[] {
  const { isPageVisible } = usePageAccess();
  return NAV_TAB_ORDER.filter((id) => isPageVisible(id)).map(
    (id) => PAGE_ROUTES[id]
  );
}
