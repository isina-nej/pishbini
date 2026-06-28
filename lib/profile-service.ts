import { prisma } from "@/lib/db";
import { getUserRankByUserId } from "@/lib/leaderboard-service";
import { isMatchLocked } from "@/lib/matches";
import { maskPhone } from "@/lib/masking";
import { PredictionChoice, PointRuleKey } from "@/generated/prisma";
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
  isCorrect: boolean | null;
  matchResultScore: string | null;
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
  referrer: { firstName: string; lastName: string } | null;
  canClaimReferrer: boolean;
  selfReferrerClaimPoints: number;
  computedScore: number;
  rank: number | null;
  correctCount: number;
  wrongCount: number;
  referralCount: number;
  predictionsCount: number;
  bracketSubmitted: boolean;
  championTeamName: string | null;
  memberSinceLabel: string;
  pushOptIn: boolean;
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
      referredByCode: true,
      basePointsAwarded: true,
      selfReferrerBonusAwarded: true,
      correctCount: true,
      wrongCount: true,
      referralCount: true,
      pushOptIn: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [rules, predictions, bracketSubmission, rank, referredRecord] = await Promise.all([
    loadActivePointRulesMap(),
    prisma.prediction.findMany({
      where: { userId: user.id },
      include: {
        match: {
          select: {
            startTime: true,
            settledAt: true,
            status: true,
            homeScore: true,
            awayScore: true,
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
    prisma.referral.findUnique({
      where: { referredUserId: user.id },
      include: {
        referrer: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const computedScore = computeUserScore(
    {
      basePointsAwarded: user.basePointsAwarded,
      selfReferrerBonusAwarded: user.selfReferrerBonusAwarded,
      correctCount: user.correctCount,
      wrongCount: user.wrongCount,
      referralCount: user.referralCount,
    },
    rules
  );

  const selfReferrerClaimPoints = rules.get(PointRuleKey.SELF_REFERRER_CLAIM) ?? 0;
  const canClaimReferrer = !user.referredByCode && !referredRecord;

  const now = new Date();

  let referrer: { firstName: string; lastName: string } | null =
    referredRecord?.referrer ?? null;

  if (!referrer && user.referredByCode) {
    const referrerUser = await prisma.user.findUnique({
      where: { referralCode: user.referredByCode },
      select: { firstName: true, lastName: true },
    });
    referrer = referrerUser;
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    maskedPhone: maskPhone(user.phone),
    referralCode: user.referralCode,
    referralLink: getReferralLink(user.referralCode),
    referrer,
    canClaimReferrer,
    selfReferrerClaimPoints,
    computedScore,
    rank,
    correctCount: user.correctCount,
    wrongCount: user.wrongCount,
    referralCount: user.referralCount,
    predictionsCount: predictions.length,
    bracketSubmitted: Boolean(bracketSubmission),
    championTeamName: bracketSubmission?.championTeam.nameFa ?? null,
    memberSinceLabel: formatPersianDateTime(user.createdAt),
    pushOptIn: user.pushOptIn,
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
      isCorrect: p.isCorrect,
      matchResultScore:
        p.match.homeScore !== null && p.match.awayScore !== null
          ? `${p.match.homeScore.toLocaleString("fa-IR")} – ${p.match.awayScore.toLocaleString("fa-IR")}`
          : null,
      pointsAwarded: p.pointsAwarded,
      createdAtLabel: formatPersianDateTime(p.createdAt),
      canEdit: p.isCorrect === null && !isMatchLocked(p.match, now),
    })),
  };
}
