import { prisma } from "@/lib/db";

const KEYS = {
  ENABLED: "BRACKET_ENABLED",
  PUBLISHED: "BRACKET_PUBLISHED",
  SUBMISSION_OPEN: "BRACKET_SUBMISSION_OPEN",
  VERSION: "BRACKET_VERSION",
} as const;

export async function getBracketConfig() {
  const settings = await prisma.campaignSetting.findMany({
    where: {
      key: { in: Object.values(KEYS) },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    enabled: map[KEYS.ENABLED] === "true",
    published: map[KEYS.PUBLISHED] === "true",
    submissionOpen: map[KEYS.SUBMISSION_OPEN] !== "false",
    version: map[KEYS.VERSION] ?? "1",
  };
}

export async function setBracketSetting(key: string, value: string) {
  return prisma.campaignSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export { KEYS as BRACKET_SETTING_KEYS };
