import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma";
import { availableMatchWhere } from "../lib/matches";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
  });
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const available = await prisma.match.findMany({
      where: availableMatchWhere(now),
      orderBy: { startTime: "asc" },
      include: { homeTeam: true, awayTeam: true },
    });
    const next = await prisma.match.findMany({
      where: { startTime: { gt: now } },
      orderBy: { startTime: "asc" },
      take: 10,
      include: { homeTeam: true, awayTeam: true },
    });
    const byStatus = await prisma.match.groupBy({
      by: ["status"],
      _count: true,
    });
    console.log("now:", now.toISOString());
    console.log("windowEnd:", windowEnd.toISOString());
    console.log("byStatus:", byStatus);
    console.log("available (24h):", available.length);
    for (const m of available) {
      console.log(
        `  ${m.startTime.toISOString()} ${m.homeTeam.code}-${m.awayTeam.code} ${m.status}`
      );
    }
    console.log("next upcoming:");
    for (const m of next) {
      console.log(
        `  ${m.startTime.toISOString()} ${m.homeTeam.code}-${m.awayTeam.code} ${m.status}`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
