import { PointRuleKey, PointTransactionType, Prisma } from "@/generated/prisma";
import { logUserActivity } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { findReferrerByCode } from "@/lib/referral-server";
import { assignReferralToUser } from "@/lib/referral-reward";

export class ReferralClaimError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "ALREADY_HAS_REFERRER"
      | "INVALID_CODE"
      | "REFERRER_NOT_FOUND"
      | "SELF_REFERRAL"
  ) {
    super(message);
    this.name = "ReferralClaimError";
  }
}

async function getActiveSelfReferrerClaimRuleInTx(tx: Prisma.TransactionClient) {
  const rule = await tx.pointRule.findFirst({
    where: { key: PointRuleKey.SELF_REFERRER_CLAIM, active: true },
  });
  return rule;
}

export async function claimReferrerByUser(
  userId: string,
  referralCodeInput: string,
  ip?: string
): Promise<{
  referrerName: string;
  pointsEarned: number;
  referralAwardedToReferrer: boolean;
}> {
  const normalized = referralCodeInput.trim().toUpperCase();
  if (!normalized) {
    throw new ReferralClaimError("کد دعوت‌کننده معتبر نیست.", "INVALID_CODE");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { referredRecord: true },
  });

  if (!user) {
    throw new ReferralClaimError("کاربر یافت نشد.", "NOT_FOUND");
  }
  if (user.referredByCode || user.referredRecord) {
    throw new ReferralClaimError("شما قبلاً دعوت‌کننده ثبت کرده‌اید.", "ALREADY_HAS_REFERRER");
  }

  const referrer = await findReferrerByCode(normalized);
  if (!referrer) {
    throw new ReferralClaimError("کد دعوت‌کننده یافت نشد.", "REFERRER_NOT_FOUND");
  }
  if (referrer.id === userId) {
    throw new ReferralClaimError("امکان ثبت کد دعوت خودتان نیست.", "SELF_REFERRAL");
  }

  const [prediction, bracketSubmission] = await Promise.all([
    prisma.prediction.findFirst({
      where: { userId },
      select: { id: true },
    }),
    prisma.bracketSubmission.findUnique({
      where: { userId },
      select: { id: true },
    }),
  ]);
  const hasSubmission = Boolean(prediction || bracketSubmission);

  let pointsEarned = 0;
  let referralAwardedToReferrer = false;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { referredByCode: referrer.referralCode },
    });

    if (hasSubmission) {
      referralAwardedToReferrer = await assignReferralToUser(tx, {
        userId,
        referralCode: referrer.referralCode,
      });
    }

    const claimRule = await getActiveSelfReferrerClaimRuleInTx(tx);
    if (claimRule && claimRule.points > 0 && !user.selfReferrerBonusAwarded) {
      pointsEarned = claimRule.points;
      await tx.user.update({
        where: { id: userId },
        data: { selfReferrerBonusAwarded: true },
      });
      await tx.pointTransaction.create({
        data: {
          userId,
          type: PointTransactionType.SELF_REFERRER_CLAIM,
          points: claimRule.points,
          reason: "امتیاز ثبت دعوت‌کننده",
        },
      });
    }
  });

  const referrerName = `${referrer.firstName} ${referrer.lastName}`;

  await logUserActivity("USER_CLAIM_REFERRER", {
    userId,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    summary: `ثبت دعوت‌کننده: ${referrerName}`,
    metadata: {
      referralCode: referrer.referralCode,
      pointsEarned,
      referralAwardedToReferrer,
      hasSubmission,
    },
    ip,
  }).catch(console.error);

  return { referrerName, pointsEarned, referralAwardedToReferrer };
}
