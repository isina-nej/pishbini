import { NextResponse } from "next/server";
import { PredictionChoice } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { availableMatchWhere } from "@/lib/matches";

function buildStatsMap(
  groups: { matchId: string; prediction: PredictionChoice; _count: { _all: number } }[]
) {
  const map = new Map<
    string,
    { homeWin: number; draw: number; awayWin: number; total: number }
  >();

  for (const g of groups) {
    const entry = map.get(g.matchId) ?? { homeWin: 0, draw: 0, awayWin: 0, total: 0 };
    const count = g._count._all;
    entry.total += count;
    if (g.prediction === PredictionChoice.HOME_WIN) entry.homeWin = count;
    else if (g.prediction === PredictionChoice.DRAW) entry.draw = count;
    else if (g.prediction === PredictionChoice.AWAY_WIN) entry.awayWin = count;
    map.set(g.matchId, entry);
  }

  return map;
}

function toPercents(entry: { homeWin: number; draw: number; awayWin: number; total: number }) {
  if (entry.total === 0) {
    return { homeWinPercent: 0, drawPercent: 0, awayWinPercent: 0, total: 0 };
  }
  return {
    homeWinPercent: Math.round((entry.homeWin / entry.total) * 100),
    drawPercent: Math.round((entry.draw / entry.total) * 100),
    awayWinPercent: Math.round((entry.awayWin / entry.total) * 100),
    total: entry.total,
  };
}

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: availableMatchWhere(),
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { startTime: "asc" },
    });

    const matchIds = matches.map((m) => m.id);
    const groups =
      matchIds.length > 0
        ? await prisma.prediction.groupBy({
            by: ["matchId", "prediction"],
            where: { matchId: { in: matchIds } },
            _count: { _all: true },
          })
        : [];

    const statsMap = buildStatsMap(groups);

    return NextResponse.json({
      matches: matches.map((m) => ({
        id: m.id,
        homeTeam: {
          nameFa: m.homeTeam.nameFa,
          nameEn: m.homeTeam.nameEn,
          code: m.homeTeam.code,
          flagUrl: m.homeTeam.flagUrl,
        },
        awayTeam: {
          nameFa: m.awayTeam.nameFa,
          nameEn: m.awayTeam.nameEn,
          code: m.awayTeam.code,
          flagUrl: m.awayTeam.flagUrl,
        },
        startTime: m.startTime.toISOString(),
        stats: toPercents(statsMap.get(m.id) ?? { homeWin: 0, draw: 0, awayWin: 0, total: 0 }),
      })),
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت بازی‌ها" }, { status: 500 });
  }
}
