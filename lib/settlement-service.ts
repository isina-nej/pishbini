import {
  MatchStatus,
  PointRuleKey,
  PointTransactionType,
  PredictionChoice,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getActivePointRules } from "@/lib/points";
import type { Prisma } from "@/generated/prisma";

export type SettlementSummary = {
  totalPredictions: number;
  correctCount: number;
  wrongCount: number;
  totalPointsAwarded: number;
  totalPointsDeducted: number;
  isResettlement: boolean;
  outcomeChanged: boolean;
};

export type MatchResultInput = {
  correctPrediction: PredictionChoice;
  homeScore?: number | null;
  awayScore?: number | null;
};

type PredictionRow = {
  id: string;
  userId: string;
  matchId: string;
  prediction: PredictionChoice;
  isCorrect: boolean | null;
  pointsAwarded: number;
  settledAt: Date | null;
};

async function reversePredictionSettlement(
  tx: Prisma.TransactionClient,
  pred: PredictionRow
) {
  if (pred.isCorrect === null || pred.settledAt === null) return;

  if (pred.isCorrect) {
    await tx.user.update({
      where: { id: pred.userId },
      data: { correctCount: { decrement: 1 } },
    });
  } else {
    await tx.user.update({
      where: { id: pred.userId },
      data: { wrongCount: { decrement: 1 } },
    });
  }

  if (pred.pointsAwarded !== 0) {
    await tx.pointTransaction.create({
      data: {
        userId: pred.userId,
        type: PointTransactionType.RESETTLEMENT,
        points: -pred.pointsAwarded,
        reason: "برگشت تسویه نتیجه بازی",
        matchId: pred.matchId,
        predictionId: pred.id,
      },
    });
  }
}

async function applyPredictionSettlement(
  tx: Prisma.TransactionClient,
  pred: PredictionRow,
  correctPrediction: PredictionChoice,
  correctPoints: number,
  wrongPoints: number,
  now: Date
) {
  const isCorrect = pred.prediction === correctPrediction;
  const points = isCorrect ? correctPoints : wrongPoints;

  await tx.prediction.update({
    where: { id: pred.id },
    data: {
      isCorrect,
      pointsAwarded: points,
      settledAt: now,
    },
  });

  await tx.user.update({
    where: { id: pred.userId },
    data: isCorrect
      ? { correctCount: { increment: 1 } }
      : { wrongCount: { increment: 1 } },
  });

  if (points !== 0) {
    await tx.pointTransaction.create({
      data: {
        userId: pred.userId,
        type: isCorrect
          ? PointTransactionType.CORRECT_PREDICTION
          : PointTransactionType.WRONG_PREDICTION,
        points,
        reason: isCorrect ? "پیش‌بینی درست" : "پیش‌بینی نادرست",
        matchId: pred.matchId,
        predictionId: pred.id,
      },
    });
  }

  return { isCorrect, points };
}

function normalizeScore(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  return value;
}

export async function applyMatchResult(
  matchId: string,
  input: MatchResultInput
): Promise<SettlementSummary> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new SettlementError("بازی یافت نشد.", 404);
  if (match.status === MatchStatus.CANCELLED) {
    throw new SettlementError("بازی لغو شده قابل ثبت نتیجه نیست.", 400);
  }

  const now = new Date();
  if (match.startTime > now) {
    throw new SettlementError("تا قبل از شروع بازی نمی‌توان نتیجه ثبت کرد.", 400);
  }

  const homeScore = normalizeScore(input.homeScore);
  const awayScore = normalizeScore(input.awayScore);
  const isResettlement = match.settledAt !== null;
  const outcomeChanged =
    isResettlement && match.correctPrediction !== input.correctPrediction;

  const rules = await getActivePointRules([
    PointRuleKey.CORRECT_PREDICTION,
    PointRuleKey.WRONG_PREDICTION,
  ]);
  const correctPoints = rules.get(PointRuleKey.CORRECT_PREDICTION)!;
  const wrongPoints = rules.get(PointRuleKey.WRONG_PREDICTION)!;

  const pushScheduledAt = new Date(now.getTime() + SETTLEMENT_PUSH_DELAY_MS);

  return prisma.$transaction(async (tx) => {
    const locked = await tx.match.findUnique({ where: { id: matchId } });
    if (!locked) throw new SettlementError("بازی یافت نشد.", 404);

    const predictions = await tx.prediction.findMany({ where: { matchId } });
    let correctCount = 0;
    let wrongCount = 0;
    let totalPointsAwarded = 0;
    let totalPointsDeducted = 0;

    if (isResettlement && outcomeChanged) {
      for (const pred of predictions) {
        await reversePredictionSettlement(tx, pred);
      }
    }

    if (!isResettlement || outcomeChanged) {
      for (const pred of predictions) {
        const { isCorrect, points } = await applyPredictionSettlement(
          tx,
          pred,
          input.correctPrediction,
          correctPoints,
          wrongPoints,
          now
        );

        if (isCorrect) {
          correctCount++;
          if (points > 0) totalPointsAwarded += points;
        } else {
          wrongCount++;
          if (points < 0) totalPointsDeducted += Math.abs(points);
          else if (points > 0) totalPointsAwarded += points;
        }
      }
    } else if (isResettlement) {
      for (const pred of predictions) {
        if (pred.isCorrect) correctCount++;
        else if (pred.isCorrect === false) wrongCount++;
        if (pred.pointsAwarded > 0) totalPointsAwarded += pred.pointsAwarded;
        if (pred.pointsAwarded < 0) totalPointsDeducted += Math.abs(pred.pointsAwarded);
      }
    }

    await tx.match.update({
      where: { id: matchId },
      data: {
        correctPrediction: input.correctPrediction,
        homeScore,
        awayScore,
        status: MatchStatus.FINISHED,
        settledAt: locked.settledAt ?? now,
        resultUpdatedAt: now,
        settlementPushScheduledAt: pushScheduledAt,
        settlementPushSentAt: null,
      },
    });

    return {
      totalPredictions: predictions.length,
      correctCount,
      wrongCount,
      totalPointsAwarded,
      totalPointsDeducted,
      isResettlement,
      outcomeChanged,
    };
  });
}

/** @deprecated Use applyMatchResult — kept for legacy settle route */
export async function settleMatch(
  matchId: string,
  correctPrediction: PredictionChoice
): Promise<SettlementSummary> {
  return applyMatchResult(matchId, { correctPrediction });
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
export { isScoreOutcomeMismatch, outcomeFromScores } from "@/lib/match-result-utils";

export const SETTLEMENT_PUSH_DELAY_MS = 10 * 60 * 1000;
