import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { getBracketConfig, setBracketSetting, BRACKET_SETTING_KEYS } from "@/lib/bracket/config";
import { validateBracketGraph } from "@/lib/bracket/graph";
import { loadBracketTree } from "@/lib/bracket/submit-service";
import { prisma } from "@/lib/db";
import { bracketSettingsSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const config = await getBracketConfig();
    const tree = await loadBracketTree();
    const submissionCount = await prisma.bracketSubmission.count();
    const errors = tree ? validateBracketGraph(tree.matches) : [];

    return NextResponse.json({
      config,
      matches: tree?.matches ?? [],
      submissionCount,
      validationErrors: errors,
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = bracketSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }

    if (parsed.data.enabled !== undefined) {
      await setBracketSetting(BRACKET_SETTING_KEYS.ENABLED, String(parsed.data.enabled));
    }
    if (parsed.data.published !== undefined) {
      await setBracketSetting(BRACKET_SETTING_KEYS.PUBLISHED, String(parsed.data.published));
    }
    if (parsed.data.submissionOpen !== undefined) {
      await setBracketSetting(
        BRACKET_SETTING_KEYS.SUBMISSION_OPEN,
        String(parsed.data.submissionOpen)
      );
    }

    const config = await getBracketConfig();
    return NextResponse.json({ config });
  } catch {
    return adminUnauthorizedResponse();
  }
}
