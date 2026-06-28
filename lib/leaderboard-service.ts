import { prisma } from "@/lib/db";
import { maskPhone } from "@/lib/masking";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import { getReferralLink } from "@/lib/utils";

export const PUBLIC_LEADERBOARD_LIMIT = 10;

export type LeaderboardEntry = {
  rank: number;
  fullName: string;
  maskedPhone: string;
  points: number;
  correctPredictions: number;
  wrongPredictions: number;
  referralCount: number;
  referralLink: string;
  userId: string;
  createdAt: Date;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode: string;
  basePointsAwarded: boolean;
  selfReferrerBonusAwarded: boolean;
  correctCount: number;
  wrongCount: number;
  referralCount: number;
  createdAt: Date;
};

function toEntry(u: UserRow, score: number): Omit<LeaderboardEntry, "rank"> {
  return {
    userId: u.id,
    fullName: `${u.firstName} ${u.lastName}`,
    maskedPhone: maskPhone(u.phone),
    points: score,
    correctPredictions: u.correctCount,
    wrongPredictions: u.wrongCount,
    referralCount: u.referralCount,
    referralLink: getReferralLink(u.referralCode),
    createdAt: u.createdAt,
  };
}

function sortEntries(
  entries: Omit<LeaderboardEntry, "rank">[]
): Omit<LeaderboardEntry, "rank">[] {
  return entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correctPredictions !== a.correctPredictions) {
      return b.correctPredictions - a.correctPredictions;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export async function getLeaderboardData(limit = PUBLIC_LEADERBOARD_LIMIT): Promise<LeaderboardEntry[]> {
  const [users, rules] = await Promise.all([
    prisma.user.findMany({
      where: { hidden: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        referralCode: true,
        basePointsAwarded: true,
        selfReferrerBonusAwarded: true,
        correctCount: true,
        wrongCount: true,
        referralCount: true,
        createdAt: true,
      },
    }),
    loadActivePointRulesMap(),
  ]);

  const scored = sortEntries(
    users.map((u) =>
      toEntry(u, computeUserScore(
        {
          basePointsAwarded: u.basePointsAwarded,
          selfReferrerBonusAwarded: u.selfReferrerBonusAwarded,
          correctCount: u.correctCount,
          wrongCount: u.wrongCount,
          referralCount: u.referralCount,
        },
        rules
      ))
    )
  ).slice(0, limit);

  return scored.map((u, i) => ({ ...u, rank: i + 1 }));
}

export async function getUserRankByReferralCode(
  referralCode: string
): Promise<LeaderboardEntry | null> {
  const [users, rules] = await Promise.all([
    prisma.user.findMany({
      where: { hidden: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        referralCode: true,
        basePointsAwarded: true,
        selfReferrerBonusAwarded: true,
        correctCount: true,
        wrongCount: true,
        referralCount: true,
        createdAt: true,
      },
    }),
    loadActivePointRulesMap(),
  ]);

  const sorted = sortEntries(
    users.map((u) =>
      toEntry(u, computeUserScore(
        {
          basePointsAwarded: u.basePointsAwarded,
          selfReferrerBonusAwarded: u.selfReferrerBonusAwarded,
          correctCount: u.correctCount,
          wrongCount: u.wrongCount,
          referralCount: u.referralCount,
        },
        rules
      ))
    )
  );

  const target = users.find((u) => u.referralCode === referralCode);
  if (!target) return null;

  const idx = sorted.findIndex((u) => u.userId === target.id);
  if (idx === -1) return null;
  return { ...sorted[idx], rank: idx + 1 };
}

export async function getUserRankByUserId(userId: string): Promise<number | null> {
  const [users, rules] = await Promise.all([
    prisma.user.findMany({
      where: { hidden: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        referralCode: true,
        basePointsAwarded: true,
        selfReferrerBonusAwarded: true,
        correctCount: true,
        wrongCount: true,
        referralCount: true,
        createdAt: true,
      },
    }),
    loadActivePointRulesMap(),
  ]);

  const sorted = sortEntries(
    users.map((u) =>
      toEntry(
        u,
        computeUserScore(
          {
            basePointsAwarded: u.basePointsAwarded,
            selfReferrerBonusAwarded: u.selfReferrerBonusAwarded,
            correctCount: u.correctCount,
            wrongCount: u.wrongCount,
            referralCount: u.referralCount,
          },
          rules
        )
      )
    )
  );

  const idx = sorted.findIndex((u) => u.userId === userId);
  if (idx === -1) return null;
  return idx + 1;
}
