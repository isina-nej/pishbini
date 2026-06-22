import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  getCampaignInfoContent,
  saveCampaignInfoContent,
} from "@/lib/campaign-info.server";
import { campaignInfoSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const content = await getCampaignInfoContent();
    return NextResponse.json({ content });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = campaignInfoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }

    await saveCampaignInfoContent(parsed.data);
    await writeAuditLog("CAMPAIGN_INFO_UPDATE", "CampaignSetting", undefined, {
      published: parsed.data.published,
    });

    return NextResponse.json({ success: true, content: parsed.data });
  } catch {
    return adminUnauthorizedResponse();
  }
}
