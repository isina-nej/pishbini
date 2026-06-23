export type PageId =
  | "predictions"
  | "bracket"
  | "leaderboard"
  | "prizes"
  | "profile";

export type PageAccessConfig = {
  enabled: boolean;
  hidden: boolean;
  message: string;
};

export type PageAccessSettings = Record<PageId, PageAccessConfig>;

export const PAGE_ACCESS_KEY = "PAGE_ACCESS";

export const PAGE_ROUTES: Record<PageId, string> = {
  predictions: "/",
  bracket: "/bracket",
  leaderboard: "/leaderboard",
  prizes: "/prizes",
  profile: "/profile",
};

export const PAGE_LABELS: Record<PageId, string> = {
  predictions: "پیش‌بینی",
  bracket: "حذفی",
  leaderboard: "رتبه‌ها",
  prizes: "جوایز",
  profile: "حساب",
};

export const NAV_TAB_ORDER: PageId[] = [
  "predictions",
  "bracket",
  "leaderboard",
  "prizes",
  "profile",
];

export const DEFAULT_PAGE_ACCESS: PageAccessSettings = {
  predictions: {
    enabled: true,
    hidden: false,
    message: "صفحه پیش‌بینی موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
  bracket: {
    enabled: true,
    hidden: false,
    message: "صفحه جدول حذفی موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
  leaderboard: {
    enabled: true,
    hidden: false,
    message: "صفحه جدول امتیازات موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
  prizes: {
    enabled: true,
    hidden: false,
    message: "صفحه جوایز موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
  profile: {
    enabled: true,
    hidden: false,
    message: "صفحه حساب کاربری موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
};

function mergePageConfig(
  id: PageId,
  partial?: Partial<PageAccessConfig>
): PageAccessConfig {
  return {
    ...DEFAULT_PAGE_ACCESS[id],
    ...partial,
    hidden: partial?.hidden ?? DEFAULT_PAGE_ACCESS[id].hidden,
  };
}

export function parsePageAccess(raw: string | null): PageAccessSettings {
  if (!raw) return { ...DEFAULT_PAGE_ACCESS };
  try {
    const parsed = JSON.parse(raw) as Partial<PageAccessSettings>;
    return {
      predictions: mergePageConfig("predictions", parsed.predictions),
      bracket: mergePageConfig("bracket", parsed.bracket),
      leaderboard: mergePageConfig("leaderboard", parsed.leaderboard),
      prizes: mergePageConfig("prizes", parsed.prizes),
      profile: mergePageConfig("profile", parsed.profile),
    };
  } catch {
    return { ...DEFAULT_PAGE_ACCESS };
  }
}

export function hrefToPageId(href: string): PageId | null {
  if (href === "/") return "predictions";
  if (href === "/bracket") return "bracket";
  if (href === "/leaderboard") return "leaderboard";
  if (href === "/prizes") return "prizes";
  if (href === "/profile" || href === "/login") return "profile";
  return null;
}

export function isPageAccessible(config: PageAccessConfig): boolean {
  return config.enabled && !config.hidden;
}

export function getFirstAccessiblePage(
  settings: PageAccessSettings
): PageId | null {
  for (const id of NAV_TAB_ORDER) {
    if (isPageAccessible(settings[id])) return id;
  }
  return null;
}
