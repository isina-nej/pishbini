import { BracketSlot, BracketStage, PrismaClient } from "../generated/prisma";
import { BRACKET_SETTING_KEYS } from "../lib/bracket/constants";
import { WC2026_TEAMS } from "../lib/world-cup-2026";

const BRACKET_GROUP_CODES = WC2026_TEAMS.filter((t) =>
  ["A", "B", "C", "D", "E", "F", "G", "H"].includes(t.group)
).map((t) => t.code);

export async function seedBracket(prisma: PrismaClient) {
  const teams = await prisma.team.findMany({
    where: { isActive: true, code: { in: BRACKET_GROUP_CODES } },
    orderBy: { code: "asc" },
  });

  if (teams.length < 32) {
    console.log("Skipping bracket seed: need 32 active teams");
    return;
  }

  await prisma.bracketPick.deleteMany();
  await prisma.bracketSubmission.deleteMany();
  // Clear self-referential FKs before delete (MySQL NoAction on homeSource/awaySource)
  await prisma.bracketMatch.updateMany({
    data: {
      homeSourceMatchId: null,
      awaySourceMatchId: null,
      nextMatchId: null,
      nextMatchSlot: null,
    },
  });
  await prisma.bracketMatch.deleteMany();

  const r32Ids: string[] = [];
  for (let i = 0; i < 16; i++) {
    const m = await prisma.bracketMatch.create({
      data: {
        stage: BracketStage.ROUND_OF_32,
        position: i,
        homeTeamId: teams[i * 2].id,
        awayTeamId: teams[i * 2 + 1].id,
      },
    });
    r32Ids.push(m.id);
  }

  const r16Ids = await linkRound(prisma, r32Ids, BracketStage.ROUND_OF_16, 8);
  const qfIds = await linkRound(prisma, r16Ids, BracketStage.QUARTER_FINAL, 4);
  const sfIds = await linkRound(prisma, qfIds, BracketStage.SEMI_FINAL, 2);
  await linkRound(prisma, sfIds, BracketStage.FINAL, 1);

  const settings: [string, string][] = [
    [BRACKET_SETTING_KEYS.ENABLED, "true"],
    [BRACKET_SETTING_KEYS.PUBLISHED, "true"],
    [BRACKET_SETTING_KEYS.SUBMISSION_OPEN, "true"],
    [BRACKET_SETTING_KEYS.VERSION, "1"],
  ];

  for (const [key, value] of settings) {
    await prisma.campaignSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  console.log("Bracket seeded: 31 matches");
}

async function linkRound(
  prisma: PrismaClient,
  prevIds: string[],
  stage: BracketStage,
  count: number
): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const homeSource = prevIds[i * 2];
    const awaySource = prevIds[i * 2 + 1];
    const m = await prisma.bracketMatch.create({
      data: {
        stage,
        position: i,
        homeSourceMatchId: homeSource,
        awaySourceMatchId: awaySource,
      },
    });
    await prisma.bracketMatch.update({
      where: { id: homeSource },
      data: { nextMatchId: m.id, nextMatchSlot: BracketSlot.HOME },
    });
    await prisma.bracketMatch.update({
      where: { id: awaySource },
      data: { nextMatchId: m.id, nextMatchSlot: BracketSlot.AWAY },
    });
    ids.push(m.id);
  }
  return ids;
}
