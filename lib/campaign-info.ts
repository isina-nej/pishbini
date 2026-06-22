export type CampaignInfoSectionIcon =
  | "trophy"
  | "target"
  | "users"
  | "star"
  | "gift"
  | "zap"
  | "medal"
  | "calendar";

export type CampaignInfoSection = {
  id: string;
  icon: CampaignInfoSectionIcon;
  title: string;
  body: string;
};

export type CampaignInfoContent = {
  published: boolean;
  heroTitle: string;
  heroSubtitle: string;
  prizeTitle: string;
  prizeDescription: string;
  prizeItems: string[];
  scoringTitle: string;
  scoringIntro: string;
  sections: CampaignInfoSection[];
  footnote: string;
};

export const CAMPAIGN_INFO_KEY = "CAMPAIGN_INFO_CONTENT";

export const DEFAULT_CAMPAIGN_INFO: CampaignInfoContent = {
  published: true,
  heroTitle: "امتیازدهی و جوایز",
  heroSubtitle: "با پیش‌بینی درست و دعوت دوستان، در جدول امتیازات بالا بروید و شانس بردن جایزه را افزایش دهید.",
  prizeTitle: "جایزه کمپین",
  prizeDescription:
    "در پایان کمپین پیش‌بینی جام جهانی، شرکت‌کننده‌ای که بیشترین امتیاز را کسب کرده باشد برنده اصلی خواهد بود.",
  prizeItems: [
    "جایزه نقدی ویژه برای نفر اول جدول امتیازات",
    "امتیازدهی شفاف و قابل پیگیری در جدول زنده",
    "هرچه بیشتر پیش‌بینی درست و دعوت موفق، امتیاز بیشتر",
  ],
  scoringTitle: "چطور امتیاز می‌گیرم؟",
  scoringIntro:
    "امتیاز شما از قوانین فعال کمپین محاسبه می‌شود و با تغییر تنظیمات ادمین، جدول امتیازات به‌روز می‌شود.",
  sections: [
    {
      id: "predict",
      icon: "target",
      title: "پیش‌بینی بازی‌ها",
      body: "برای هر بازی در بازه ۲۴ ساعته قبل از شروع، یکی از گزینه‌های برد میزبان، مساوی یا برد مهمان را انتخاب کنید.",
    },
    {
      id: "referral",
      icon: "users",
      title: "دعوت دوستان",
      body: "لینک دعوت اختصاصی خود را برای دوستان بفرستید. با ثبت‌نام موفق هر نفر جدید، امتیاز دعوت به شما اضافه می‌شود.",
    },
    {
      id: "leaderboard",
      icon: "trophy",
      title: "جدول امتیازات",
      body: "رتبه‌بندی بر اساس مجموع امتیاز، تعداد پیش‌بینی درست و تاریخ ثبت‌نام انجام می‌شود. وضعیت خود را هر لحظه ببینید.",
    },
  ],
  footnote:
    "تساوی امتیاز با تعداد پیش‌بینی درست و سپس تاریخ ثبت‌نام زودتر شکسته می‌شود. تصمیم نهایی برگزیدگان با تیم پیشرو سرمایه است.",
};

export function parseCampaignInfo(raw: string | null): CampaignInfoContent {
  if (!raw) return structuredClone(DEFAULT_CAMPAIGN_INFO);
  try {
    const parsed = JSON.parse(raw) as Partial<CampaignInfoContent>;
    return {
      ...DEFAULT_CAMPAIGN_INFO,
      ...parsed,
      prizeItems: parsed.prizeItems ?? DEFAULT_CAMPAIGN_INFO.prizeItems,
      sections: parsed.sections?.length ? parsed.sections : DEFAULT_CAMPAIGN_INFO.sections,
    };
  } catch {
    return structuredClone(DEFAULT_CAMPAIGN_INFO);
  }
}
