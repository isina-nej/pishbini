import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import { getReferralLink } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const minPoints = searchParams.get("minPoints");
    const maxPoints = searchParams.get("maxPoints");

    const [users, rules] = await Promise.all([
      prisma.user.findMany({
        include: {
          _count: { select: { predictions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      loadActivePointRulesMap(),
    ]);

    let result = users.map((u) => {
      const computedScore = computeUserScore(
        {
          basePointsAwarded: u.basePointsAwarded,
          correctCount: u.correctCount,
          wrongCount: u.wrongCount,
          referralCount: u.referralCount,
        },
        rules
      );
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        referralCode: u.referralCode,
        referralLink: getReferralLink(u.referralCode),
        referredByCode: u.referredByCode,
        points: computedScore,
        totalPredictions: u._count.predictions,
        correctPredictions: u.correctCount,
        wrongPredictions: u.wrongCount,
        referralCount: u.referralCount,
        hidden: u.hidden,
        createdAt: u.createdAt.toISOString(),
      };
    });

    if (q) {
      result = result.filter(
        (u) =>
          u.firstName.includes(q) ||
          u.lastName.includes(q) ||
          u.phone.includes(q) ||
          u.referralCode.includes(q.toUpperCase())
      );
    }

    if (minPoints) {
      const min = Number(minPoints);
      result = result.filter((u) => u.points >= min);
    }
    if (maxPoints) {
      const max = Number(maxPoints);
      result = result.filter((u) => u.points <= max);
    }

    result.sort((a, b) => b.points - a.points);

    return NextResponse.json({ users: result.slice(0, 200) });
  } catch {
    return adminUnauthorizedResponse();
  }
}
