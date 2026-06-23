import "server-only";

import { getCampaignSetting, setCampaignSetting } from "@/lib/campaign";
import {
  DEFAULT_SPLASH_VIDEO_PATH,
  SPLASH_VIDEO_KEY,
} from "@/lib/splash-screen.shared";

export { DEFAULT_SPLASH_VIDEO_PATH, SPLASH_VIDEO_KEY } from "@/lib/splash-screen.shared";

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
