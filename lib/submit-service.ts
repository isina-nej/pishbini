import { prisma } from "@/lib/db";
import { isCampaignFrozen } from "@/lib/campaign";
import { isMatchLocked } from "@/lib/matches";
import { maskPhone } from "@/lib/masking";
import { normalizePhone } from "@/lib/phone";
import { generateReferralCode, normalizeReferralCode } from "@/lib/referral";
import { awardReferralIfEligible } from "@/lib/referral-reward";
import { sendConfirmationSms } from "@/lib/sms";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import type { SubmitInput } from "@/lib/validation";
import { getReferralLink } from "@/lib/utils";

export type SubmitResult = {
  firstName: string;
  lastName: string;
  phone: string;
  referralCode: string;
  referralLink: string;
  computedScore: number;
  newPredictionsCount: number;
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

  const referralCodeInput = normalizeReferralCode(input.referralCode ?? "");

  try {
    const { user, newPredictionsCount } = await prisma.$transaction(async (tx) => {
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
            basePointsAwarded: true,
          },
        });
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
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
        throw new SubmitError("همه پیش‌بینی‌های انتخاب‌شده قبلاً ثبت شده‌اند.", 400);
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

      if (isNewUser && referralCodeInput) {
        await awardReferralIfEligible(tx, {
          isNewUser,
          userId: user.id,
          phone,
          referralCodeInput,
        });
      }

      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      return { user: updatedUser, newPredictionsCount: newPredictions.length };
    });

    sendConfirmationSms(user.id, user.phone, user.referralCode).catch(console.error);

    const rules = await loadActivePointRulesMap();
    const computedScore = computeUserScore(
      {
        basePointsAwarded: user.basePointsAwarded,
        correctCount: user.correctCount,
        wrongCount: user.wrongCount,
        referralCount: user.referralCount,
      },
      rules
    );

    return {
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: maskPhone(user.phone),
        referralCode: user.referralCode,
        referralLink: getReferralLink(user.referralCode),
        computedScore,
        newPredictionsCount,
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
