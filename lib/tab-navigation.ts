export type NavTransitionType = "nav-forward" | "nav-back";

type TabRouter = {
  push: (
    href: string,
    options?: { transitionTypes?: NavTransitionType[] }
  ) => void;
  prefetch: (href: string) => void;
};

export function getNavTransitionType(
  currentIndex: number,
  targetIndex: number
): NavTransitionType {
  if (targetIndex === currentIndex) return "nav-forward";
  return targetIndex > currentIndex ? "nav-forward" : "nav-back";
}

export function getTabNavIndex(
  pathname: string,
  visibleHrefs: readonly string[]
): number {
  const path = pathname === "/login" ? "/profile" : pathname;
  return visibleHrefs.indexOf(path);
}

export function navigateTab(
  router: TabRouter,
  href: string,
  transitionType: NavTransitionType,
  reduceMotion?: boolean | null
) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.tabNav = transitionType;
  }

  const go = () => {
    router.push(href, { transitionTypes: [transitionType] });
  };

  if (
    !reduceMotion &&
    typeof document !== "undefined" &&
    "startViewTransition" in document
  ) {
    document.startViewTransition(go);
  } else {
    go();
  }
}
