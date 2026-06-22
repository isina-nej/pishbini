export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ADMIN_LOGIN: "ورود ادمین",
  ADMIN_LOGOUT: "خروج ادمین",
  USER_REGISTER: "ثبت‌نام کاربر",
  USER_SUBMIT: "ثبت پیش‌بینی",
  USER_OTP_REQUEST: "درخواست کد تأیید",
  USER_BRACKET_SUBMIT: "ثبت جدول حذفی",
  USER_SUBMIT_BLOCKED: "رد ثبت (حساب مخفی)",
  ADMIN_USER_UPDATE: "ویرایش کاربر",
  ADMIN_USER_HIDE: "مخفی‌سازی کاربر",
  ADMIN_USER_UNHIDE: "نمایش کاربر",
  ADMIN_USER_DELETE: "حذف کاربر",
  CAMPAIGN_FREEZE: "فریز کمپین",
  MARK_WINNER: "ثبت برنده",
  MATCH_SETTLE: "تسویه بازی",
  POINT_RULE_UPDATE: "تغییر قانون امتیاز",
  PAGE_ACCESS_UPDATE: "تغییر دسترسی صفحات",
  CAMPAIGN_INFO_UPDATE: "ویرایش صفحه جوایز",
  BRACKET_PUBLISH: "انتشار جدول حذفی",
};

export const AUDIT_ACTOR_LABELS: Record<string, string> = {
  ADMIN: "ادمین",
  USER: "کاربر",
  SYSTEM: "سیستم",
};

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
