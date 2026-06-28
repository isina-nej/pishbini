import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";

export async function GET() {
  try {
    await requireAdmin();
    const [users, rules] = await Promise.all([
      prisma.user.findMany({
        include: {
          predictions: { include: { match: { include: { homeTeam: true, awayTeam: true } } } },
          referralsMade: { include: { referred: { select: { firstName: true, lastName: true, phone: true } } } },
          referredRecord: { include: { referrer: { select: { firstName: true, lastName: true, referralCode: true } } } },
          smsLogs: true,
          pointTransactions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      loadActivePointRulesMap(),
    ]);

    const rows = users.map((u) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      referralCode: u.referralCode,
      referredByCode: u.referredByCode ?? "",
      points: computeUserScore(
        {
          basePointsAwarded: u.basePointsAwarded,
          selfReferrerBonusAwarded: u.selfReferrerBonusAwarded,
          correctCount: u.correctCount,
          wrongCount: u.wrongCount,
          referralCount: u.referralCount,
        },
        rules
      ),
      totalPredictions: u.predictions.length,
      correctPredictions: u.correctCount,
      wrongPredictions: u.wrongCount,
      referralCount: u.referralCount,
      createdAt: u.createdAt.toISOString(),
    }));

    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="participants.csv"',
      },
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
