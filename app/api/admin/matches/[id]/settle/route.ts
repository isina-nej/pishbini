import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import { SettlementError, settleMatch } from "@/lib/settlement-service";
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

    const summary = await settleMatch(id, parsed.data.correctPrediction);
    await writeAuditLog("MATCH_SETTLE", "Match", id, {
      correctPrediction: parsed.data.correctPrediction,
      ...summary,
    });

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    if (err instanceof SettlementError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return adminUnauthorizedResponse();
  }
}
