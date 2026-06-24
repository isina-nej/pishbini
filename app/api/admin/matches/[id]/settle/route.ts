import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { handleAdminRouteError } from "@/lib/admin-route";
import { writeAuditLog } from "@/lib/audit";
import { applyMatchResult, SettlementError } from "@/lib/settlement-service";
import { settleSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = settleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "نتیجه نامعتبر" }, { status: 400 });
    }

    const summary = await applyMatchResult(id, {
      correctPrediction: parsed.data.correctPrediction,
    });

    await writeAuditLog(
      summary.isResettlement ? "MATCH_RESULT_UPDATE" : "MATCH_SETTLE",
      "Match",
      id,
      {
        correctPrediction: parsed.data.correctPrediction,
        ...summary,
      }
    );

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    if (err instanceof SettlementError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleAdminRouteError(err, "خطا در تسویه بازی");
  }
}
