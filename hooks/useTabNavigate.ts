"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { PAGE_ROUTES, type PageId } from "@/lib/page-access.shared";
import { getNavTransitionType, getTabNavIndex, navigateTab } from "@/lib/tab-navigation";
import { useVisibleNavHrefs } from "@/components/public/BottomNav";

export function useTabNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const visibleHrefs = useVisibleNavHrefs();
  const currentIndex = getTabNavIndex(pathname, visibleHrefs);

  const navigateToTab = useCallback(
    (pageId: PageId) => {
      const href = PAGE_ROUTES[pageId];
      const targetIndex = getTabNavIndex(href, visibleHrefs);
      if (targetIndex === -1 || currentIndex === -1) {
        router.push(href);
        return;
      }
      if (pathname === href || (href === "/profile" && pathname === "/login")) {
        return;
      }
      const transitionType = getNavTransitionType(currentIndex, targetIndex);
      navigateTab(router, href, transitionType, reduceMotion);
    },
    [currentIndex, pathname, reduceMotion, router, visibleHrefs]
  );

  const navigateToHref = useCallback(
    (href: string) => {
      const targetIndex = getTabNavIndex(href, visibleHrefs);
      if (targetIndex === -1 || currentIndex === -1) {
        router.push(href);
        return;
      }
      if (pathname === href) return;
      const transitionType = getNavTransitionType(currentIndex, targetIndex);
      navigateTab(router, href, transitionType, reduceMotion);
    },
    [currentIndex, pathname, reduceMotion, router, visibleHrefs]
  );

  return { navigateToTab, navigateToHref };
}
