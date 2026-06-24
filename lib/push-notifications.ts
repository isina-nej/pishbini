import { MatchStatus, PointRuleKey, PredictionChoice } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { isMatchAvailableForPrediction } from "@/lib/matches";
import { getActivePointRules } from "@/lib/points";
import { formatPredictionChoice, formatPredictionResult } from "@/lib/prediction-labels";
import { sendPushBroadcast, sendPushToUser } from "@/lib/push-service";

function formatMatchScoreLine(
  homeName: string,
  awayName: string,
  homeScore: number | null,
  awayScore: number | null,
  correctPrediction: PredictionChoice
): string {
  if (homeScore !== null && awayScore !== null) {
    return `${homeName} ${homeScore.toLocaleString("fa-IR")} – ${awayScore.toLocaleString("fa-IR")} ${awayName}`;
  }
  return formatPredictionChoice(correctPrediction, homeName, awayName);
}

export async function notifyMatchSettlement(matchId: string): Promise<number> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { nameFa: true } },
      awayTeam: { select: { nameFa: true } },
      predictions: { select: { userId: true, prediction: true } },
    },
  });

  if (!match || !match.correctPrediction || match.predictions.length === 0) {
    return 0;
  }

  const rules = await getActivePointRules([
    PointRuleKey.CORRECT_PREDICTION,
    PointRuleKey.WRONG_PREDICTION,
  ]);
  const correctPoints = rules.get(PointRuleKey.CORRECT_PREDICTION) ?? 0;
  const wrongPoints = rules.get(PointRuleKey.WRONG_PREDICTION) ?? 0;

  const title = `نتیجه ${match.homeTeam.nameFa} – ${match.awayTeam.nameFa} اعلام شد`;
  const scoreLine = formatMatchScoreLine(
    match.homeTeam.nameFa,
    match.awayTeam.nameFa,
    match.homeScore,
    match.awayScore,
    match.correctPrediction
  );

  const results = await Promise.allSettled(
    match.predictions.map((pred) => {
      const isCorrect = pred.prediction === match.correctPrediction;
      const points = isCorrect ? correctPoints : wrongPoints;
      const body = `${scoreLine} — پیش‌بینی شما ${formatPredictionResult(isCorrect, points)}`;
      return sendPushToUser(pred.userId, { title, body, url: "/profile" });
    })
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

export async function processPendingSettlementPushes(): Promise<{
  matchesProcessed: number;
  pushDelivered: number;
}> {
  const now = new Date();

  const pending = await prisma.match.findMany({
    where: {
      settledAt: { not: null },
      settlementPushScheduledAt: { lte: now },
      settlementPushSentAt: null,
      status: MatchStatus.FINISHED,
    },
    select: { id: true },
    orderBy: { settlementPushScheduledAt: "asc" },
  });

  if (pending.length === 0) {
    return { matchesProcessed: 0, pushDelivered: 0 };
  }

  let pushDelivered = 0;

  for (const { id } of pending) {
    const delivered = await notifyMatchSettlement(id);
    pushDelivered += delivered;

    await prisma.match.update({
      where: { id },
      data: { settlementPushSentAt: now },
    });
  }

  return { matchesProcessed: pending.length, pushDelivered };
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
