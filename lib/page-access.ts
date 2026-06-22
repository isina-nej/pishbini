export type PageId = "predictions" | "bracket" | "leaderboard";

export type PageAccessConfig = {
  enabled: boolean;
  message: string;
};

export type PageAccessSettings = Record<PageId, PageAccessConfig>;

export const PAGE_ACCESS_KEY = "PAGE_ACCESS";

export const PAGE_ROUTES: Record<PageId, string> = {
  predictions: "/",
  bracket: "/bracket",
  leaderboard: "/leaderboard",
};

export const PAGE_LABELS: Record<PageId, string> = {
  predictions: "پیش‌بینی",
  bracket: "جدول حذفی",
  leaderboard: "جدول امتیازات",
};

export const DEFAULT_PAGE_ACCESS: PageAccessSettings = {
  predictions: {
    enabled: true,
    message: "صفحه پیش‌بینی موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
  bracket: {
    enabled: true,
    message: "صفحه جدول حذفی موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
  leaderboard: {
    enabled: true,
    message: "صفحه جدول امتیازات موقتاً غیرفعال است. لطفاً بعداً مراجعه کنید.",
  },
};

export function parsePageAccess(raw: string | null): PageAccessSettings {
  if (!raw) return { ...DEFAULT_PAGE_ACCESS };
  try {
    const parsed = JSON.parse(raw) as Partial<PageAccessSettings>;
    return {
      predictions: { ...DEFAULT_PAGE_ACCESS.predictions, ...parsed.predictions },
      bracket: { ...DEFAULT_PAGE_ACCESS.bracket, ...parsed.bracket },
      leaderboard: { ...DEFAULT_PAGE_ACCESS.leaderboard, ...parsed.leaderboard },
    };
  } catch {
    return { ...DEFAULT_PAGE_ACCESS };
  }
}

export function hrefToPageId(href: string): PageId | null {
  if (href === "/") return "predictions";
  if (href === "/bracket") return "bracket";
  if (href === "/leaderboard") return "leaderboard";
  return null;
}
