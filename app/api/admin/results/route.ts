import { NextResponse } from "next/server";
import { MatchStatus } from "@/generated/prisma";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { handleAdminRouteError } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();

    const matches = await prisma.match.findMany({
      where: {
        startTime: { lte: now },
        status: { not: MatchStatus.CANCELLED },
      },
      include: {
        homeTeam: { select: { id: true, nameFa: true, code: true } },
        awayTeam: { select: { id: true, nameFa: true, code: true } },
        _count: { select: { predictions: true } },
      },
      orderBy: [{ settledAt: "asc" }, { startTime: "desc" }],
    });

    return NextResponse.json({
      matches: matches.map((m) => ({
        id: m.id,
        startTime: m.startTime.toISOString(),
        status: m.status,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        predictionsCount: m._count.predictions,
        correctPrediction: m.correctPrediction,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        settledAt: m.settledAt?.toISOString() ?? null,
        resultUpdatedAt: m.resultUpdatedAt?.toISOString() ?? null,
        settlementPushScheduledAt: m.settlementPushScheduledAt?.toISOString() ?? null,
        settlementPushSentAt: m.settlementPushSentAt?.toISOString() ?? null,
      })),
      serverNow: now.toISOString(),
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
