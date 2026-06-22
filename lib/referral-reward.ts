import { PointRuleKey, PointTransactionType, Prisma } from "@/generated/prisma";
import { maskPhone } from "@/lib/masking";

async function getActivePointRuleInTx(tx: Prisma.TransactionClient, key: PointRuleKey) {
  const rule = await tx.pointRule.findFirst({ where: { key, active: true } });
  if (!rule) throw new Error(`Point rule not found: ${key}`);
  return rule;
}

/** Award referral points when a new user registers with a valid referral code. */
export async function awardReferralIfEligible(
  tx: Prisma.TransactionClient,
  opts: {
    isNewUser: boolean;
    userId: string;
    phone: string;
    referralCodeInput: string | null;
  }
): Promise<void> {
  const { isNewUser, userId, phone, referralCodeInput } = opts;
  if (!isNewUser || !referralCodeInput) return;

  const referrer = await tx.user.findUnique({
    where: { referralCode: referralCodeInput },
  });
  if (!referrer || referrer.id === userId) return;

  const existingReferral = await tx.referral.findUnique({
    where: { referredUserId: userId },
  });
  if (existingReferral) return;

  const referralRule = await getActivePointRuleInTx(tx, PointRuleKey.REFERRAL_SUCCESS);
  const referral = await tx.referral.create({
    data: {
      referrerUserId: referrer.id,
      referredUserId: userId,
      referralCode: referralCodeInput,
      pointsAwarded: referralRule.points,
    },
  });
  await tx.user.update({
    where: { id: referrer.id },
    data: { points: { increment: referralRule.points } },
  });
  await tx.pointTransaction.create({
    data: {
      userId: referrer.id,
      type: PointTransactionType.REFERRAL_SUCCESS,
      points: referralRule.points,
      reason: `دعوت کاربر ${maskPhone(phone)}`,
      referralId: referral.id,
    },
  });
}
