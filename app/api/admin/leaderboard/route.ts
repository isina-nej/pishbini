import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { getCampaignSetting } from "@/lib/campaign";
import { toCsv } from "@/lib/csv";
import { getLeaderboardData } from "@/lib/leaderboard-service";

export async function GET() {
  try {
    await requireAdmin();
    const users = await getLeaderboardData(50);
    const frozen = await getCampaignSetting("CAMPAIGN_FROZEN");
    const winnerId = await getCampaignSetting("PRIZE_WINNER_USER_ID");

    return NextResponse.json({
      users,
      campaignFrozen: frozen === "true",
      prizeWinnerUserId: winnerId,
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
