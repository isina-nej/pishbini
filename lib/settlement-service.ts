import {
  MatchStatus,
  PointRuleKey,
  PredictionChoice,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getActivePointRules } from "@/lib/points";

export type SettlementSummary = {
  totalPredictions: number;
  correctCount: number;
  wrongCount: number;
  totalPointsAwarded: number;
  totalPointsDeducted: number;
};

export async function settleMatch(
  matchId: string,
  correctPrediction: PredictionChoice
): Promise<SettlementSummary> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new SettlementError("بازی یافت نشد.", 404);
  if (match.settledAt) throw new SettlementError("این بازی قبلاً تسویه شده است.", 409);

  const rules = await getActivePointRules([
    PointRuleKey.CORRECT_PREDICTION,
    PointRuleKey.WRONG_PREDICTION,
  ]);
  const correctPoints = rules.get(PointRuleKey.CORRECT_PREDICTION)!;
  const wrongPoints = rules.get(PointRuleKey.WRONG_PREDICTION)!;

  return prisma.$transaction(async (tx) => {
    const locked = await tx.match.findUnique({ where: { id: matchId } });
    if (!locked || locked.settledAt) {
      throw new SettlementError("این بازی قبلاً تسویه شده است.", 409);
    }

    const predictions = await tx.prediction.findMany({ where: { matchId } });
    const now = new Date();
    let correctCount = 0;
    let wrongCount = 0;
    let totalPointsAwarded = 0;
    let totalPointsDeducted = 0;

    for (const pred of predictions) {
      const isCorrect = pred.prediction === correctPrediction;
      const points = isCorrect ? correctPoints : wrongPoints;

      await tx.prediction.update({
        where: { id: pred.id },
        data: {
          isCorrect,
          pointsAwarded: 0,
          settledAt: now,
        },
      });

      await tx.user.update({
        where: { id: pred.userId },
        data: isCorrect
          ? { correctCount: { increment: 1 } }
          : { wrongCount: { increment: 1 } },
      });

      if (isCorrect) {
        correctCount++;
        if (points > 0) totalPointsAwarded += points;
      } else {
        wrongCount++;
        if (points < 0) totalPointsDeducted += Math.abs(points);
        else if (points > 0) totalPointsAwarded += points;
      }
    }

    await tx.match.update({
      where: { id: matchId },
      data: {
        correctPrediction,
        status: MatchStatus.FINISHED,
        settledAt: now,
      },
    });

    return {
      totalPredictions: predictions.length,
      correctCount,
      wrongCount,
      totalPointsAwarded,
      totalPointsDeducted,
    };
  });
}

class SettlementError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export { SettlementError };
