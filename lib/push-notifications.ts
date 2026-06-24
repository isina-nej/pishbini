import { MatchStatus, PointRuleKey, PredictionChoice } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { isMatchAvailableForPrediction } from "@/lib/matches";
import { getActivePointRules } from "@/lib/points";
import { formatPredictionResult } from "@/lib/prediction-labels";
import { sendPushBroadcast, sendPushToUser } from "@/lib/push-service";

export async function notifyMatchSettlement(
  matchId: string,
  correctPrediction: PredictionChoice
): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { nameFa: true } },
      awayTeam: { select: { nameFa: true } },
      predictions: { select: { userId: true, prediction: true } },
    },
  });

  if (!match || match.predictions.length === 0) return;

  const rules = await getActivePointRules([
    PointRuleKey.CORRECT_PREDICTION,
    PointRuleKey.WRONG_PREDICTION,
  ]);
  const correctPoints = rules.get(PointRuleKey.CORRECT_PREDICTION) ?? 0;
  const wrongPoints = rules.get(PointRuleKey.WRONG_PREDICTION) ?? 0;

  const title = `نتیجه ${match.homeTeam.nameFa} – ${match.awayTeam.nameFa} اعلام شد`;

  await Promise.allSettled(
    match.predictions.map((pred) => {
      const isCorrect = pred.prediction === correctPrediction;
      const points = isCorrect ? correctPoints : wrongPoints;
      const body = `پیش‌بینی شما ${formatPredictionResult(isCorrect, points)}`;
      return sendPushToUser(pred.userId, { title, body, url: "/profile" });
    })
  );
}

export async function notifyNewPredictionWindows(): Promise<{
  matchesNotified: number;
  pushDelivered: number;
}> {
  const now = new Date();
  const candidates = await prisma.match.findMany({
    where: {
      predictionWindowNotifiedAt: null,
      status: { in: [MatchStatus.SCHEDULED, MatchStatus.ACTIVE] },
    },
    include: {
      homeTeam: { select: { nameFa: true } },
      awayTeam: { select: { nameFa: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const eligible = candidates.filter((m) => isMatchAvailableForPrediction(m, now));
  if (eligible.length === 0) {
    return { matchesNotified: 0, pushDelivered: 0 };
  }

  let pushDelivered = 0;

  for (const match of eligible) {
    const title = "بازی جدید برای پیش‌بینی";
    const body = `${match.homeTeam.nameFa} – ${match.awayTeam.nameFa}`;
    const delivered = await sendPushBroadcast({ title, body, url: "/" });

    await prisma.match.update({
      where: { id: match.id },
      data: { predictionWindowNotifiedAt: now },
    });

    pushDelivered += delivered;
  }

  return { matchesNotified: eligible.length, pushDelivered };
}
