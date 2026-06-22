import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  getPageAccessSettings,
  savePageAccessSettings,
} from "@/lib/page-access.server";
import { type PageAccessSettings } from "@/lib/page-access";
import { pageAccessSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const pages = await getPageAccessSettings();
    return NextResponse.json({ pages });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = pageAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }

    const pages: PageAccessSettings = parsed.data;
    await savePageAccessSettings(pages);
    await writeAuditLog("PAGE_ACCESS_UPDATE", "CampaignSetting", undefined, pages);

    return NextResponse.json({ success: true, pages });
  } catch {
    return adminUnauthorizedResponse();
  }
}
