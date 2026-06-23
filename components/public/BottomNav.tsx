"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Home, GitBranch, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_TAB_ORDER,
  PAGE_LABELS,
  PAGE_ROUTES,
  type PageId,
} from "@/lib/page-access.shared";
import { usePageAccess } from "./PageAccessProvider";

const PAGE_ICONS: Record<PageId, typeof Home> = {
  predictions: Home,
  bracket: GitBranch,
  leaderboard: Trophy,
  prizes: Gift,
  profile: User,
};

export function BottomNav() {
  const pathname = usePathname();
  const { loaded, isPageVisible } = usePageAccess();

  const visibleTabs = NAV_TAB_ORDER.filter((id) => !loaded || isPageVisible(id));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href || (href === "/profile" && pathname === "/login")) {
      e.preventDefault();
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#10111f]/95 px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg">
      <div className="flex justify-around">
        {visibleTabs.map((id) => {
          const href = PAGE_ROUTES[id];
          const label = PAGE_LABELS[id];
          const Icon = PAGE_ICONS[id];
          const active =
            pathname === href || (id === "profile" && pathname === "/login");

          return (
            <Link
              key={id}
              href={href}
              data-tour={`nav-${id}`}
              onClick={(e) => handleClick(e, href)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-1 text-[9px] transition-colors sm:text-[10px]",
                active ? "text-primary" : "text-white/50 hover:text-white/70"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function useVisibleNavHrefs(): string[] {
  const { loaded, isPageVisible } = usePageAccess();
  return NAV_TAB_ORDER.filter((id) => !loaded || isPageVisible(id)).map(
    (id) => PAGE_ROUTES[id]
  );
}
