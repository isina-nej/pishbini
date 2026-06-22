const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const REFERRAL_COOKIE_NAME = "wc_referral";
export const REFERRAL_STORAGE_KEY = "wc_referral_code";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function generateReferralCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/** Normalize referral code from URL, cookie, or form input */
export function normalizeReferralCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  if (!code || code.length < 5 || code.length > 12) return null;
  if (!/^[A-Z0-9]+$/.test(code)) return null;
  return code;
}

export function resolveReferralCode(
  bodyCode: string | null | undefined,
  cookieCode: string | undefined
): string | null {
  return normalizeReferralCode(bodyCode ?? "") ?? normalizeReferralCode(cookieCode ?? "");
}
