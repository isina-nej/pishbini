import type { PageId } from "@/lib/page-access.shared";
import { NAV_TAB_ORDER, PAGE_LABELS } from "@/lib/page-access.shared";

export const TOUR_STORAGE_KEY = "wc_product_tour_v2";

export type TourKey = PageId | "login";

export type TourAdvance = "click-target" | "next-button";

export type TourStep = {
  id: string;
  target: string;
  title: string;
  description: string;
  advance: TourAdvance;
  blockNavigation?: boolean;
  optional?: boolean;
  waitForTarget?: boolean;
  /** Scroll page so bottom-fixed targets (submit, nav) are in view */
  scrollTo?: "bottom" | "target";
  /** Mobile: dock tooltip above bottom nav instead of floating near target */
  placement?: "auto" | "sheet";
};

export type TourPageState = Partial<Record<TourKey, boolean>>;

export function readTourState(): TourPageState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) ?? "{}") as TourPageState;
  } catch {
    return {};
  }
}

export function isTourDone(key: TourKey): boolean {
  return Boolean(readTourState()[key]);
}

export function markTourDone(key: TourKey): void {
  const state = readTourState();
  state[key] = true;
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
}

export function restartTour(key: TourKey): void {
  const state = readTourState();
  delete state[key];
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("wc:tour-restart", { detail: { key } }));
}

export function tourKeyForRoute(pageId: PageId, pathname: string): TourKey {
  if (pathname === "/login") return "login";
  return pageId;
}

const NAV_DESCRIPTIONS: Record<PageId, string> = {
  predictions: "بازی‌های قابل پیش‌بینی را اینجا می‌بینید و نتیجه را انتخاب می‌کنید.",
  bracket: "جدول حذفی جام جهانی — مسیر قهرمانی را مرحله‌به‌مرحله پیش‌بینی کنید.",
  leaderboard: "رتبه‌بندی شرکت‌کنندگان و امتیازات زنده را اینجا ببینید.",
  prizes: "جوایز کمپین و قوانین امتیازدهی در این بخش توضیح داده شده است.",
  profile: "حساب کاربری، تاریخچه پیش‌بینی‌ها و لینک دعوت دوستان شما.",
};

export function predictionsTourSteps(
  visiblePages: PageId[],
  hasMatches: boolean
): TourStep[] {
  const steps: TourStep[] = [
    {
      id: "home-header",
      target: "home-header",
      title: "صفحه پیش‌بینی",
      description: "اینجا بازی‌های قابل پیش‌بینی را می‌بینید و نتیجه را انتخاب می‌کنید.",
      advance: "next-button",
    },
  ];

  if (hasMatches) {
    steps.push(
      {
        id: "pick-team",
        target: "match-flags",
        title: "انتخاب تیم",
        description:
          "روی پرچم یکی از تیم‌ها بزنید تا آن تیم به‌عنوان برنده انتخاب شود.",
        advance: "click-target",
      },
      {
        id: "match-timer",
        target: "match-timer",
        title: "زمان باقی‌مانده",
        description:
          "این شمارش معکوس نشان می‌دهد چقدر تا پایان مهلت پیش‌بینی و شروع بازی باقی مانده است.",
        advance: "next-button",
      },
      {
        id: "submit",
        target: "submit-predictions",
        title: "ثبت پیش‌بینی",
        description:
          "بعد از انتخاب بازی‌ها، با این دکمه پیش‌بینی‌هایتان را ثبت کنید.",
        advance: "click-target",
        waitForTarget: true,
        scrollTo: "bottom",
        placement: "sheet",
      }
    );
  }

  for (const pageId of NAV_TAB_ORDER) {
    if (!visiblePages.includes(pageId)) continue;
    steps.push({
      id: `nav-${pageId}`,
      target: `nav-${pageId}`,
      title: PAGE_LABELS[pageId],
      description: NAV_DESCRIPTIONS[pageId],
      advance: "click-target",
      blockNavigation: true,
      scrollTo: "bottom",
      placement: "sheet",
    });
  }

  return steps;
}

const LOGIN_TOUR: TourStep[] = [
  {
    id: "login-header",
    target: "login-header",
    title: "ورود به حساب",
    description: "برای دیدن تاریخچه پیش‌بینی‌ها و لینک دعوت، با شماره موبایل وارد شوید.",
    advance: "next-button",
  },
  {
    id: "login-phone",
    target: "login-phone",
    title: "شماره موبایل",
    description: "همان شماره‌ای را وارد کنید که با آن پیش‌بینی ثبت کرده‌اید.",
    advance: "next-button",
  },
  {
    id: "login-send",
    target: "login-send",
    title: "دریافت کد",
    description: "با این دکمه کد تأیید ۴ رقمی برای شما پیامک می‌شود.",
    advance: "next-button",
  },
];

const PROFILE_TOUR: TourStep[] = [
  {
    id: "profile-header",
    target: "profile-header",
    title: "پروفایل شما",
    description: "نام، شماره موبایل و تاریخ عضویت در کمپین را اینجا می‌بینید.",
    advance: "next-button",
    scrollTo: "target",
  },
  {
    id: "profile-stats",
    target: "profile-stats",
    title: "آمار و امتیاز",
    description:
      "امتیاز کل، رتبه، تعداد پیش‌بینی‌های درست و نادرست و دعوت‌های موفق در این کارت‌ها نمایش داده می‌شود.",
    advance: "next-button",
  },
  {
    id: "profile-referral",
    target: "profile-referral",
    title: "لینک دعوت",
    description: "لینک اختصاصی خود را کپی کنید و برای دوستان بفرستید تا امتیاز بگیرید.",
    advance: "next-button",
  },
  {
    id: "profile-referral-copy",
    target: "profile-referral-copy",
    title: "کپی لینک",
    description: "با این دکمه لینک دعوت در کلیپ‌بورد کپی می‌شود.",
    advance: "next-button",
  },
  {
    id: "profile-bracket",
    target: "profile-bracket",
    title: "وضعیت جدول حذفی",
    description: "اگر جدول حذفی ثبت کرده باشید، قهرمان پیش‌بینی‌شده اینجا نمایش داده می‌شود.",
    advance: "next-button",
    optional: true,
  },
  {
    id: "profile-history",
    target: "profile-history",
    title: "تاریخچه پیش‌بینی",
    description: "همه پیش‌بینی‌های قبلی با نتیجه درست یا نادرست در این بخش لیست می‌شوند.",
    advance: "next-button",
  },
  {
    id: "profile-edit",
    target: "profile-edit",
    title: "ویرایش پیش‌بینی",
    description:
      "اگر مهلت بازی هنوز تمام نشده باشد، می‌توانید پیش‌بینی ثبت‌شده را از اینجا ویرایش کنید.",
    advance: "next-button",
    optional: true,
  },
  {
    id: "profile-logout",
    target: "profile-logout",
    title: "خروج از حساب",
    description: "برای خروج امن از حساب کاربری از این دکمه استفاده کنید.",
    advance: "next-button",
  },
  {
    id: "profile-replay-tour",
    target: "profile-replay-tour",
    title: "آموزش مجدد",
    description: "هر وقت خواستید آموزش این صفحه را دوباره ببینید، این دکمه را بزنید.",
    advance: "next-button",
  },
];

export const PAGE_TOUR_STEPS: Record<PageId, (visible: PageId[]) => TourStep[]> = {
  predictions: (visible) => predictionsTourSteps(visible, true),

  bracket: () => [
    {
      id: "bracket-header",
      target: "bracket-header",
      title: "جدول حذفی",
      description: "مسیر قهرمانی جام جهانی را مرحله‌به‌مرحله پیش‌بینی کنید.",
      advance: "next-button",
    },
    {
      id: "bracket-progress",
      target: "bracket-progress",
      title: "پیشرفت شما",
      description: "تعداد بازی‌هایی که انتخاب کرده‌اید و درصد پیشرفت اینجا نمایش داده می‌شود.",
      advance: "next-button",
    },
    {
      id: "bracket-stages",
      target: "bracket-stages",
      title: "مراحل حذفی",
      description: "با این تب‌ها بین یک‌هشتم، یک‌چهارم، نیمه‌نهایی و فینال جابه‌جا شوید.",
      advance: "next-button",
    },
    {
      id: "bracket-pick",
      target: "bracket-match",
      title: "انتخاب برنده",
      description: "روی تیمی که فکر می‌کنید برنده این بازی می‌شود بزنید.",
      advance: "click-target",
      optional: true,
    },
    {
      id: "bracket-reset",
      target: "bracket-reset",
      title: "شروع دوباره",
      description: "برای پاک کردن همه انتخاب‌ها و شروع از اول از این دکمه استفاده کنید.",
      advance: "next-button",
    },
    {
      id: "bracket-submit",
      target: "bracket-submit",
      title: "ثبت نهایی",
      description: "بعد از تکمیل همه ۳۱ بازی، با این دکمه پیش‌بینی قهرمانی را ثبت کنید.",
      advance: "next-button",
      scrollTo: "bottom",
      placement: "sheet",
    },
  ],

  leaderboard: () => [
    {
      id: "leaderboard-header",
      target: "leaderboard-header",
      title: "جدول امتیازات",
      description: "رتبه‌بندی زنده شرکت‌کنندگان بر اساس امتیاز، پیش‌بینی درست و دعوت.",
      advance: "next-button",
    },
    {
      id: "leaderboard-top-score",
      target: "leaderboard-top-score",
      title: "بیشترین امتیاز",
      description: "امتیاز بالاترین شرکت‌کننده در حال حاضر.",
      advance: "next-button",
      optional: true,
    },
    {
      id: "leaderboard-podium",
      target: "leaderboard-podium",
      title: "سکوی برترها",
      description: "سه نفر اول جدول با جزئیات امتیاز و آمار.",
      advance: "next-button",
      optional: true,
    },
    {
      id: "leaderboard-list",
      target: "leaderboard-list",
      title: "رتبه‌های ۴ تا ۱۰",
      description: "ادامه جدول امتیازات برای رتبه‌های بعدی.",
      advance: "next-button",
      optional: true,
    },
    {
      id: "leaderboard-prizes-link",
      target: "leaderboard-prizes-link",
      title: "جوایز و قوانین",
      description: "از اینجا به صفحه جوایز و قوانین امتیازدهی بروید.",
      advance: "next-button",
    },
  ],

  prizes: () => [
    {
      id: "prizes-hero",
      target: "prizes-hero",
      title: "جوایز کمپین",
      description: "معرفی کلی جوایز و شرایط شرکت در کمپین.",
      advance: "next-button",
    },
    {
      id: "prizes-list",
      target: "prizes-list",
      title: "لیست جوایز",
      description: "جزئیات جوایز و شرایط برنده شدن را اینجا بخوانید.",
      advance: "next-button",
    },
    {
      id: "prizes-scoring",
      target: "prizes-scoring",
      title: "قوانین امتیاز",
      description: "امتیاز هر نوع پیش‌بینی درست در این بخش مشخص شده است.",
      advance: "next-button",
    },
    {
      id: "prizes-sections",
      target: "prizes-sections",
      title: "راهنمای کمپین",
      description: "نکات و توضیحات تکمیلی درباره نحوه شرکت و امتیازگیری.",
      advance: "next-button",
      optional: true,
    },
    {
      id: "prizes-leaderboard-cta",
      target: "prizes-leaderboard-cta",
      title: "مشاهده رتبه‌ها",
      description: "برای دیدن جایگاه خود در جدول امتیازات این دکمه را بزنید.",
      advance: "next-button",
    },
  ],

  profile: () => PROFILE_TOUR,
};

export function buildTourSteps(
  tourKey: TourKey,
  visiblePages: PageId[],
  options?: { hasMatches?: boolean }
): TourStep[] {
  if (tourKey === "login") return LOGIN_TOUR;
  if (tourKey === "predictions") {
    return predictionsTourSteps(visiblePages, options?.hasMatches ?? true);
  }
  return PAGE_TOUR_STEPS[tourKey](visiblePages);
}
