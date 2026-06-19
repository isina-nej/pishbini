import { prisma } from "@/lib/db";
import { maskPhone } from "@/lib/masking";

export type LeaderboardEntry = {
  rank: number;
  fullName: string;
  maskedPhone: string;
  points: number;
  correctPredictions: number;
  userId: string;
  createdAt: Date;
};

export async function getLeaderboardData(limit = 10): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          predictions: { where: { isCorrect: true } },
        },
      },
    },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: limit * 3,
  });

  const sorted = users
    .map((u) => ({
      userId: u.id,
      fullName: `${u.firstName} ${u.lastName}`,
      maskedPhone: maskPhone(u.phone),
      points: u.points,
      correctPredictions: u._count.predictions,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.correctPredictions !== a.correctPredictions)
        return b.correctPredictions - a.correctPredictions;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, limit);

  return sorted.map((u, i) => ({ ...u, rank: i + 1 }));
}

export async function getUserRankByReferralCode(
  referralCode: string
): Promise<LeaderboardEntry | null> {
  const user = await prisma.user.findUnique({ where: { referralCode } });
  if (!user) return null;

  const allUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          predictions: { where: { isCorrect: true } },
        },
      },
    },
  });

  const sorted = allUsers
    .map((u) => ({
      userId: u.id,
      fullName: `${u.firstName} ${u.lastName}`,
      maskedPhone: maskPhone(u.phone),
      points: u.points,
      correctPredictions: u._count.predictions,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.correctPredictions !== a.correctPredictions)
        return b.correctPredictions - a.correctPredictions;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  const idx = sorted.findIndex((u) => u.userId === user.id);
  if (idx === -1) return null;
  return { ...sorted[idx], rank: idx + 1 };
}
