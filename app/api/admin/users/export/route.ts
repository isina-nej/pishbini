import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      include: {
        predictions: { include: { match: { include: { homeTeam: true, awayTeam: true } } } },
        referralsMade: { include: { referred: { select: { firstName: true, lastName: true, phone: true } } } },
        referredRecord: { include: { referrer: { select: { firstName: true, lastName: true, referralCode: true } } } },
        smsLogs: true,
        pointTransactions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = users.map((u) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      referralCode: u.referralCode,
      referredByCode: u.referredByCode ?? "",
      points: u.points,
      totalPredictions: u.predictions.length,
      correctPredictions: u.predictions.filter((p) => p.isCorrect === true).length,
      referralCount: u.referralsMade.length,
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
