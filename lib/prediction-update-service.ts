import { PredictionChoice } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { isCampaignFrozen } from "@/lib/campaign";
import { availableMatchWhere, isMatchLocked } from "@/lib/matches";

export type UserPredictionRow = {
  matchId: string;
  prediction: PredictionChoice;
  canEdit: boolean;
};

export async function getUserOpenPredictions(
  userId: string
): Promise<UserPredictionRow[]> {
  const frozen = await isCampaignFrozen();
  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      match: availableMatchWhere(),
    },
    select: {
      matchId: true,
      prediction: true,
      isCorrect: true,
      match: {
        select: {
          startTime: true,
          status: true,
        },
      },
    },
  });

  const now = new Date();

  return predictions.map((p) => ({
    matchId: p.matchId,
    prediction: p.prediction,
    canEdit: !frozen && p.isCorrect === null && !isMatchLocked(p.match, now),
  }));
}

export async function updateUserPrediction(
  userId: string,
  matchId: string,
  prediction: PredictionChoice
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  if (await isCampaignFrozen()) {
    return { success: false, error: "ویرایش پیش‌بینی پس از پایان ایونت غیرفعال است.", status: 403 };
  }

  const existing = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId, matchId } },
    include: {
      match: {
        select: {
          startTime: true,
          status: true,
        },
      },
    },
  });

  if (!existing) {
    return { success: false, error: "پیش‌بینی یافت نشد.", status: 404 };
  }

  if (existing.isCorrect !== null) {
    return { success: false, error: "این پیش‌بینی قابل ویرایش نیست.", status: 400 };
  }

  const now = new Date();
  if (isMatchLocked(existing.match, now)) {
    return {
      success: false,
      error: "زمان ویرایش این پیش‌بینی به پایان رسیده است.",
      status: 400,
    };
  }

  const inWindow = await prisma.match.count({
    where: { id: matchId, ...availableMatchWhere(now) },
  });

  if (inWindow === 0) {
    return {
      success: false,
      error: "این بازی در بازه پیش‌بینی فعال نیست.",
      status: 400,
    };
  }

  await prisma.prediction.update({
    where: { id: existing.id },
    data: { prediction },
  });

  return { success: true };
}
