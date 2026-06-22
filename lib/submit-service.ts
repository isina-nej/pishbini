import {
  PointRuleKey,
  PointTransactionType,
  Prisma,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { isCampaignFrozen } from "@/lib/campaign";
import { isMatchLocked } from "@/lib/matches";
import { maskPhone } from "@/lib/masking";
import { normalizePhone } from "@/lib/phone";
import { getActivePointRule } from "@/lib/points";
import { generateReferralCode } from "@/lib/referral";
import { awardReferralIfEligible } from "@/lib/referral-reward";
import { sendConfirmationSms } from "@/lib/sms";
import type { SubmitInput } from "@/lib/validation";
import { getReferralLink } from "@/lib/utils";

export type SubmitResult = {
  firstName: string;
  lastName: string;
  phone: string;
  points: number;
  referralCode: string;
  referralLink: string;
};

export async function processSubmission(
  input: SubmitInput
): Promise<{ success: true; data: SubmitResult } | { success: false; error: string; status: number }> {
  if (await isCampaignFrozen()) {
    return { success: false, error: "کمپین به پایان رسیده است.", status: 403 };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { success: false, error: "شماره موبایل معتبر نیست.", status: 400 };
  }

  const matchIds = [...new Set(input.predictions.map((p) => p.matchId))];
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
  });

  if (matches.length !== matchIds.length) {
    return { success: false, error: "برخی بازی‌ها یافت نشدند.", status: 400 };
  }

  const now = new Date();
  for (const match of matches) {
    if (isMatchLocked(match, now)) {
      return {
        success: false,
        error: "زمان پیش‌بینی برای برخی بازی‌ها به پایان رسیده است.",
        status: 400,
      };
    }
  }

  const referralCodeInput = input.referralCode?.trim().toUpperCase() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { phone } });
      const isNewUser = !user;

      if (!user) {
        let code = generateReferralCode();
        let attempts = 0;
        while (attempts < 10) {
          const exists = await tx.user.findUnique({ where: { referralCode: code } });
          if (!exists) break;
          code = generateReferralCode();
          attempts++;
        }

        user = await tx.user.create({
          data: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            phone,
            referralCode: code,
            referredByCode: referralCodeInput,
          },
        });
      }

      const existingPredictions = await tx.prediction.findMany({
        where: { userId: user.id, matchId: { in: matchIds } },
        select: { matchId: true },
      });
      const existingMatchIds = new Set(existingPredictions.map((p) => p.matchId));
      const newPredictions = input.predictions.filter((p) => !existingMatchIds.has(p.matchId));

      if (newPredictions.length === 0) {
        throw new SubmitError("شما قبلاً برای این بازی‌ها پیش‌بینی ثبت کرده‌اید.", 400);
      }

      for (const p of newPredictions) {
        await tx.prediction.create({
          data: {
            userId: user!.id,
            matchId: p.matchId,
            prediction: p.prediction,
          },
        });
      }

      if (isNewUser && !user.basePointsAwarded) {
        const baseRule = await getActivePointRuleInTx(tx, PointRuleKey.BASE_REGISTRATION);
        await tx.user.update({
          where: { id: user.id },
          data: {
            points: { increment: baseRule.points },
            basePointsAwarded: true,
          },
        });
        await tx.pointTransaction.create({
          data: {
            userId: user.id,
            type: PointTransactionType.BASE_REGISTRATION,
            points: baseRule.points,
            reason: "امتیاز ثبت‌نام",
          },
        });
      }

      if (isNewUser && referralCodeInput) {
        await awardReferralIfEligible(tx, {
          isNewUser,
          userId: user.id,
          phone,
          referralCodeInput,
        });
      }

      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      return updatedUser;
    });

    sendConfirmationSms(result.id, result.phone, result.referralCode).catch(console.error);

    return {
      success: true,
      data: {
        firstName: result.firstName,
        lastName: result.lastName,
        phone: maskPhone(result.phone),
        points: result.points,
        referralCode: result.referralCode,
        referralLink: getReferralLink(result.referralCode),
      },
    };
  } catch (err) {
    if (err instanceof SubmitError) {
      return { success: false, error: err.message, status: err.status };
    }
    throw err;
  }
}

class SubmitError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function getActivePointRuleInTx(
  tx: Prisma.TransactionClient,
  key: PointRuleKey
) {
  const rule = await tx.pointRule.findFirst({ where: { key, active: true } });
  if (!rule) throw new Error(`Point rule not found: ${key}`);
  return rule;
}
