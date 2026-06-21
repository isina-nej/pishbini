import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import { getBracketConfig, setBracketSetting, BRACKET_SETTING_KEYS } from "@/lib/bracket/config";
import { validateBracketGraph } from "@/lib/bracket/graph";
import { loadBracketTree } from "@/lib/bracket/submit-service";

export async function POST() {
  try {
    await requireAdmin();
    const tree = await loadBracketTree();
    if (!tree) {
      return NextResponse.json({ error: "جدول حذفی خالی است." }, { status: 400 });
    }

    const errors = validateBracketGraph(tree.matches);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "اعتبارسنجی ناموفق", errors },
        { status: 400 }
      );
    }

    await setBracketSetting(BRACKET_SETTING_KEYS.PUBLISHED, "true");
    await setBracketSetting(BRACKET_SETTING_KEYS.ENABLED, "true");
    await writeAuditLog("BRACKET_PUBLISH");

    const config = await getBracketConfig();
    return NextResponse.json({ success: true, config });
  } catch {
    return adminUnauthorizedResponse();
  }
}
