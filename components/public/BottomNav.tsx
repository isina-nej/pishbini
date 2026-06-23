"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  onClick,
  reduceMotion,
}: {
  id: PageId;
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  reduceMotion: boolean | null;
}) {
  return (
    <Link
      href={href}
      data-tour={`nav-${id}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
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
  const reduceMotion = useReducedMotion();
  const { loaded, isPageVisible } = usePageAccess();

  const visibleTabs = NAV_TAB_ORDER.filter((id) => !loaded || isPageVisible(id));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href || (href === "/profile" && pathname === "/login")) {
      e.preventDefault();
    }
  };

  return (
    <motion.nav
      aria-label="ناوبری اصلی"
      className={cn(
        "fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2",
        "rounded-full border border-white/12 bg-white/[0.06]",
        "px-1.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
        "ring-1 ring-inset ring-white/10 backdrop-blur-xl"
      )}
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-stretch justify-around">
        {visibleTabs.map((id) => {
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
              reduceMotion={reduceMotion}
              onClick={(e) => handleClick(e, href)}
            />
          );
        })}
      </div>
    </motion.nav>
  );
}

export function useVisibleNavHrefs(): string[] {
  const { loaded, isPageVisible } = usePageAccess();
  return NAV_TAB_ORDER.filter((id) => !loaded || isPageVisible(id)).map(
    (id) => PAGE_ROUTES[id]
  );
}
