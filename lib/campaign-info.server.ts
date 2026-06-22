import { getCampaignSetting, setCampaignSetting } from "@/lib/campaign";
import {
  CAMPAIGN_INFO_KEY,
  parseCampaignInfo,
  type CampaignInfoContent,
} from "@/lib/campaign-info";

export async function getCampaignInfoContent(): Promise<CampaignInfoContent> {
  const raw = await getCampaignSetting(CAMPAIGN_INFO_KEY);
  return parseCampaignInfo(raw);
}

export async function saveCampaignInfoContent(content: CampaignInfoContent): Promise<void> {
  await setCampaignSetting(CAMPAIGN_INFO_KEY, JSON.stringify(content));
}
