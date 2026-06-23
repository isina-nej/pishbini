import { prisma } from "@/lib/db";
import { BRACKET_SETTING_KEYS } from "./constants";

export async function getBracketConfig() {
  const settings = await prisma.campaignSetting.findMany({
    where: {
      key: { in: Object.values(BRACKET_SETTING_KEYS) },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    enabled: map[BRACKET_SETTING_KEYS.ENABLED] === "true",
    published: map[BRACKET_SETTING_KEYS.PUBLISHED] === "true",
    submissionOpen: map[BRACKET_SETTING_KEYS.SUBMISSION_OPEN] !== "false",
    version: map[BRACKET_SETTING_KEYS.VERSION] ?? "1",
  };
}

export async function setBracketSetting(key: string, value: string) {
  return prisma.campaignSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export { BRACKET_SETTING_KEYS };
