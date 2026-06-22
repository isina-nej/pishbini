import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [user, rules] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        include: {
          predictions: {
            include: {
              match: { include: { homeTeam: true, awayTeam: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          referralsMade: {
            include: {
              referred: { select: { firstName: true, lastName: true, phone: true, createdAt: true } },
            },
          },
          referredRecord: {
            include: {
              referrer: { select: { firstName: true, lastName: true, referralCode: true } },
            },
          },
          smsLogs: { orderBy: { createdAt: "desc" } },
          pointTransactions: { orderBy: { createdAt: "desc" } },
        },
      }),
      loadActivePointRulesMap(),
    ]);

    if (!user) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    const computedScore = computeUserScore(
      {
        basePointsAwarded: user.basePointsAwarded,
        correctCount: user.correctCount,
        wrongCount: user.wrongCount,
        referralCount: user.referralCount,
      },
      rules
    );

    return NextResponse.json({
      user: {
        ...user,
        points: computedScore,
        correctCount: user.correctCount,
        wrongCount: user.wrongCount,
      },
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
