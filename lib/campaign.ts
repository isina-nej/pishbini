import { prisma } from "@/lib/db";

export async function isCampaignFrozen(): Promise<boolean> {
  const setting = await prisma.campaignSetting.findUnique({
    where: { key: "CAMPAIGN_FROZEN" },
  });
  return setting?.value === "true";
}

export async function getCampaignSetting(key: string): Promise<string | null> {
  const setting = await prisma.campaignSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function setCampaignSetting(key: string, value: string) {
  return prisma.campaignSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
