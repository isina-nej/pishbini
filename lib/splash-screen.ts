import "server-only";

import { getCampaignSetting, setCampaignSetting } from "@/lib/campaign";

export const SPLASH_VIDEO_KEY = "SPLASH_VIDEO";
export const DEFAULT_SPLASH_VIDEO_PATH = "/splash_screen/splash_screen.mp4";

export async function getSplashVideoPath(): Promise<string> {
  const value = await getCampaignSetting(SPLASH_VIDEO_KEY);
  return value?.trim() || DEFAULT_SPLASH_VIDEO_PATH;
}

export async function setSplashVideoPath(path: string): Promise<void> {
  await setCampaignSetting(SPLASH_VIDEO_KEY, path);
}

export async function resetSplashVideoPath(): Promise<void> {
  await setCampaignSetting(SPLASH_VIDEO_KEY, DEFAULT_SPLASH_VIDEO_PATH);
}
