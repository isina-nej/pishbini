import { MatchStatus, PrismaClient } from "../generated/prisma";
import { flagUrlForTeam } from "@/lib/team-flag";
import { WC2026_FIXTURES, WC2026_TEAM_CODES, WC2026_TEAMS } from "@/lib/world-cup-2026";
import { WC2026_ROUND_OF_32 } from "@/lib/world-cup-knockout";

const ALL_FIXTURES = [...WC2026_FIXTURES, ...WC2026_ROUND_OF_32];

const LEGACY_CODES = ["IRI", "DEN", "POL", "WAL", "CMR", "SRB", "CRC", "ITA"];

function statusForKickoff(startTime: Date, now: Date): MatchStatus {
  if (startTime.getTime() <= now.getTime()) {
    return MatchStatus.FINISHED;
  }
  const hoursUntil = (startTime.getTime() - now.getTime()) / (3600 * 1000);
  if (hoursUntil <= 24) {
    return MatchStatus.ACTIVE;
  }
  return MatchStatus.SCHEDULED;
}

export async function seedWorldCup2026(
  prisma: PrismaClient,
  options: { cleanupOrphans?: boolean; touchStatus?: boolean } = {}
) {
  const { cleanupOrphans = false, touchStatus = true } = options;
  for (const team of WC2026_TEAMS) {
    await prisma.team.upsert({
      where: { code: team.code },
      create: {
        code: team.code,
        nameFa: team.nameFa,
        nameEn: team.nameEn,
        flagUrl: flagUrlForTeam(team.code),
        isActive: true,
      },
      update: {
        nameFa: team.nameFa,
        nameEn: team.nameEn,
        flagUrl: flagUrlForTeam(team.code),
        isActive: true,
      },
    });
  }

  for (const code of LEGACY_CODES) {
    await prisma.team.updateMany({
      where: { code },
      data: { isActive: false },
    });
  }

  const teamByCode = Object.fromEntries(
    (await prisma.team.findMany({ where: { code: { in: [...WC2026_TEAM_CODES] } } })).map((t) => [
      t.code,
      t.id,
    ])
  );

  const now = new Date();
  let created = 0;
  let updated = 0;

  for (const fixture of ALL_FIXTURES) {
    const homeTeamId = teamByCode[fixture.homeCode];
    const awayTeamId = teamByCode[fixture.awayCode];
    if (!homeTeamId || !awayTeamId) {
      console.warn(`Skip fixture ${fixture.homeCode} vs ${fixture.awayCode}: team missing`);
      continue;
    }

    const startTime = new Date(fixture.startTime);
    const status = statusForKickoff(startTime, now);

    const existing = await prisma.match.findFirst({
      where: { homeTeamId, awayTeamId, startTime },
    });

    if (existing) {
      const data: { status?: MatchStatus } = {};
      if (touchStatus) {
        const nextStatus = statusForKickoff(startTime, now);
        if (
          existing.status === MatchStatus.SCHEDULED ||
          existing.status === MatchStatus.ACTIVE
        ) {
          data.status = nextStatus;
        }
      }
      if (Object.keys(data).length > 0) {
        await prisma.match.update({ where: { id: existing.id }, data });
      }
      updated++;
    } else {
      await prisma.match.create({
        data: { homeTeamId, awayTeamId, startTime, status },
      });
      created++;
    }
  }

  console.log(
    `World Cup 2026: ${WC2026_TEAMS.length} teams, ${created} matches created, ${updated} updated (${ALL_FIXTURES.length} fixtures)`
  );

  if (!cleanupOrphans) return;

  const officialKeys = new Set(
    ALL_FIXTURES.map((f) => `${f.homeCode}:${f.awayCode}:${f.startTime}`)
  );
  const allMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });
  let removed = 0;
  for (const m of allMatches) {
    const key = `${m.homeTeam.code}:${m.awayTeam.code}:${m.startTime.toISOString()}`;
    const legacyTeam =
      LEGACY_CODES.includes(m.homeTeam.code) || LEGACY_CODES.includes(m.awayTeam.code);
    if (legacyTeam || !officialKeys.has(key)) {
      await prisma.prediction.deleteMany({ where: { matchId: m.id } });
      await prisma.match.delete({ where: { id: m.id } });
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`Removed ${removed} orphan/legacy matches`);
  }
}
