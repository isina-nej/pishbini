import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import {
  normalizeReferralCode,
  resolveReferralCode,
  type ReferrerInfo,
} from "@/lib/referral";

export type { ReferrerInfo };

const referrerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  referralCode: true,
  phone: true,
} as const;

/** Look up referrer by normalized referral code. */
export async function findReferrerByCode(code: string | null): Promise<ReferrerInfo | null> {
  const normalized = normalizeReferralCode(code ?? "");
  if (!normalized) return null;
  return prisma.user.findUnique({
    where: { referralCode: normalized },
    select: referrerSelect,
  });
}

/** Resolve referrer from mobile number or referral code (admin). */
export async function resolveReferrerIdentifier(input: string): Promise<ReferrerInfo | null> {
  const trimmed = input.trim();
  const phone = normalizePhone(trimmed);
  if (phone) {
    return prisma.user.findUnique({
      where: { phone },
      select: referrerSelect,
    });
  }
  return findReferrerByCode(trimmed);
}

/** Returns referral code only when referrer exists and is not self-referral. */
export async function resolveReferralCodeForRegistration(
  bodyCode: string | null | undefined,
  cookieCode: string | undefined,
  newUserPhone: string
): Promise<string | null> {
  const code = resolveReferralCode(bodyCode, cookieCode);
  if (!code) return null;
  const referrer = await findReferrerByCode(code);
  if (!referrer || referrer.phone === newUserPhone) return null;
  return code;
}
