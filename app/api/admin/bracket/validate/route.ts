import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { validateBracketGraph } from "@/lib/bracket/graph";
import { loadBracketTree } from "@/lib/bracket/submit-service";

export async function POST() {
  try {
    await requireAdmin();
    const tree = await loadBracketTree();
    if (!tree) {
      return NextResponse.json({
        valid: false,
        errors: [{ code: "EMPTY", message: "جدول حذفی خالی است." }],
      });
    }
    const errors = validateBracketGraph(tree.matches);
    return NextResponse.json({ valid: errors.length === 0, errors });
  } catch {
    return adminUnauthorizedResponse();
  }
}
