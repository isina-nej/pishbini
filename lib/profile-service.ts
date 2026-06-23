import { prisma } from "@/lib/db";
import { getUserRankByUserId } from "@/lib/leaderboard-service";
import { isMatchLocked } from "@/lib/matches";
import { maskPhone } from "@/lib/masking";
import { PredictionChoice } from "@/generated/prisma";
import { formatPredictionChoice, formatPredictionResult } from "@/lib/prediction-labels";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import { getReferralLink } from "@/lib/utils";
import { formatPersianDateTime } from "@/lib/dates";

export type ProfilePrediction = {
  id: string;
  matchId: string;
  prediction: PredictionChoice;
  matchLabel: string;
  homeTeamName: string;
  awayTeamName: string;
  startTime: string;
  startTimeLabel: string;
  predictionLabel: string;
  resultLabel: string;
  pointsAwarded: number;
  createdAtLabel: string;
  canEdit: boolean;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  maskedPhone: string;
  referralCode: string;
  referralLink: string;
  computedScore: number;
  rank: number | null;
  correctCount: number;
  wrongCount: number;
  referralCount: number;
  predictionsCount: number;
  bracketSubmitted: boolean;
  championTeamName: string | null;
  memberSinceLabel: string;
  predictions: ProfilePrediction[];
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      referralCode: true,
      basePointsAwarded: true,
      correctCount: true,
      wrongCount: true,
      referralCount: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [rules, predictions, bracketSubmission, rank] = await Promise.all([
    loadActivePointRulesMap(),
    prisma.prediction.findMany({
      where: { userId: user.id },
      include: {
        match: {
          include: {
            homeTeam: { select: { nameFa: true } },
            awayTeam: { select: { nameFa: true } },
          },
        },
      },
      orderBy: [{ match: { startTime: "desc" } }, { createdAt: "desc" }],
    }),
    prisma.bracketSubmission.findUnique({
      where: { userId: user.id },
      include: { championTeam: { select: { nameFa: true } } },
    }),
    getUserRankByUserId(user.id),
  ]);

  const computedScore = computeUserScore(
    {
      basePointsAwarded: user.basePointsAwarded,
      correctCount: user.correctCount,
      wrongCount: user.wrongCount,
      referralCount: user.referralCount,
    },
    rules
  );

  const now = new Date();

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    maskedPhone: maskPhone(user.phone),
    referralCode: user.referralCode,
    referralLink: getReferralLink(user.referralCode),
    computedScore,
    rank,
    correctCount: user.correctCount,
    wrongCount: user.wrongCount,
    referralCount: user.referralCount,
    predictionsCount: predictions.length,
    bracketSubmitted: Boolean(bracketSubmission),
    championTeamName: bracketSubmission?.championTeam.nameFa ?? null,
    memberSinceLabel: formatPersianDateTime(user.createdAt),
    predictions: predictions.map((p) => ({
      id: p.id,
      matchId: p.matchId,
      prediction: p.prediction,
      matchLabel: `${p.match.homeTeam.nameFa} – ${p.match.awayTeam.nameFa}`,
      homeTeamName: p.match.homeTeam.nameFa,
      awayTeamName: p.match.awayTeam.nameFa,
      startTime: p.match.startTime.toISOString(),
      startTimeLabel: formatPersianDateTime(p.match.startTime),
      predictionLabel: formatPredictionChoice(
        p.prediction,
        p.match.homeTeam.nameFa,
        p.match.awayTeam.nameFa
      ),
      resultLabel: formatPredictionResult(p.isCorrect, p.pointsAwarded),
      pointsAwarded: p.pointsAwarded,
      createdAtLabel: formatPersianDateTime(p.createdAt),
      canEdit: p.isCorrect === null && !isMatchLocked(p.match, now),
    })),
  };
}
