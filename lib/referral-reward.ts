import { PointRuleKey, Prisma } from "@/generated/prisma";

async function getActivePointRuleInTx(tx: Prisma.TransactionClient, key: PointRuleKey) {
  const rule = await tx.pointRule.findFirst({ where: { key, active: true } });
  if (!rule) throw new Error(`Point rule not found: ${key}`);
  return rule;
}

/** Award referral on first successful submission with a valid code (idempotent). */
export async function awardReferralIfEligible(
  tx: Prisma.TransactionClient,
  opts: {
    userId: string;
    referralCodeInput: string | null;
  }
): Promise<boolean> {
  const { userId, referralCodeInput } = opts;
  if (!referralCodeInput) return false;

  const referrer = await tx.user.findUnique({
    where: { referralCode: referralCodeInput },
  });
  if (!referrer || referrer.id === userId) return false;

  const existingReferral = await tx.referral.findUnique({
    where: { referredUserId: userId },
  });
  if (existingReferral) return false;

  const referralRule = await getActivePointRuleInTx(tx, PointRuleKey.REFERRAL_SUCCESS);
  await tx.referral.create({
    data: {
      referrerUserId: referrer.id,
      referredUserId: userId,
      referralCode: referralCodeInput,
      pointsAwarded: referralRule.points,
    },
  });
  await tx.user.update({
    where: { id: referrer.id },
    data: { referralCount: { increment: 1 } },
  });
  return true;
}

/** Persist attribution on user when missing; does not award points (award happens on submit). */
export async function backfillReferredByCodeIfEmpty(
  tx: Prisma.TransactionClient,
  userId: string,
  currentReferredByCode: string | null | undefined,
  referralCodeInput: string | null
): Promise<void> {
  if (!referralCodeInput || currentReferredByCode) return;
  await tx.user.update({
    where: { id: userId },
    data: { referredByCode: referralCodeInput },
  });
}

/** Backfill attribution and award referral if eligible (idempotent). */
export async function assignReferralToUser(
  tx: Prisma.TransactionClient,
  opts: { userId: string; referralCode: string }
): Promise<boolean> {
  const user = await tx.user.findUnique({ where: { id: opts.userId } });
  if (!user) return false;
  await backfillReferredByCodeIfEmpty(tx, opts.userId, user.referredByCode, opts.referralCode);
  return awardReferralIfEligible(tx, {
    userId: opts.userId,
    referralCodeInput: opts.referralCode,
  });
}
