import "server-only";

import { getCampaignSetting, setCampaignSetting } from "@/lib/campaign";
import {
  PAGE_ACCESS_KEY,
  parsePageAccess,
  type PageAccessSettings,
} from "@/lib/page-access.shared";

export async function getPageAccessSettings(): Promise<PageAccessSettings> {
  const raw = await getCampaignSetting(PAGE_ACCESS_KEY);
  return parsePageAccess(raw);
}

export async function savePageAccessSettings(settings: PageAccessSettings): Promise<void> {
  await setCampaignSetting(PAGE_ACCESS_KEY, JSON.stringify(settings));
}
