import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { availableMatchWhere } from "@/lib/matches";

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
      })),
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت بازی‌ها" }, { status: 500 });
  }
}
