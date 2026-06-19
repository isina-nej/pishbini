import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import { setCampaignSetting } from "@/lib/campaign";
import { campaignFreezeSchema, markWinnerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if ("frozen" in body) {
      const parsed = campaignFreezeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
      }
      await setCampaignSetting("CAMPAIGN_FROZEN", String(parsed.data.frozen));
      if (parsed.data.frozen) {
        await setCampaignSetting("CAMPAIGN_FROZEN_AT", new Date().toISOString());
      }
      await writeAuditLog("CAMPAIGN_FREEZE", "Campaign", undefined, parsed.data);
      return NextResponse.json({ success: true, frozen: parsed.data.frozen });
    }

    if ("userId" in body) {
      const parsed = markWinnerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
      }
      await setCampaignSetting("PRIZE_WINNER_USER_ID", parsed.data.userId);
      await writeAuditLog("MARK_WINNER", "User", parsed.data.userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  } catch {
    return adminUnauthorizedResponse();
  }
}
