import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { handleAdminRouteError } from "@/lib/admin-route";
import { writeAuditLog } from "@/lib/audit";
import { applyMatchResult, SettlementError } from "@/lib/settlement-service";
import { isScoreOutcomeMismatch } from "@/lib/match-result-utils";
import { matchResultSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = matchResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "نتیجه نامعتبر است" }, { status: 400 });
    }

    const homeScore =
      parsed.data.homeScore === undefined ? null : parsed.data.homeScore;
    const awayScore =
      parsed.data.awayScore === undefined ? null : parsed.data.awayScore;

    const summary = await applyMatchResult(id, {
      correctPrediction: parsed.data.correctPrediction,
      homeScore,
      awayScore,
    });

    await writeAuditLog(
      summary.isResettlement ? "MATCH_RESULT_UPDATE" : "MATCH_RESULT_SAVE",
      "Match",
      id,
      {
        correctPrediction: parsed.data.correctPrediction,
        homeScore,
        awayScore,
        ...summary,
      }
    );

    const scoreWarning = isScoreOutcomeMismatch(
      parsed.data.correctPrediction,
      homeScore,
      awayScore
    );

    return NextResponse.json({
      success: true,
      summary,
      scoreWarning: scoreWarning
        ? "گل‌های واردشده با نتیجه انتخاب‌شده هم‌خوانی ندارند."
        : null,
    });
  } catch (err) {
    if (err instanceof SettlementError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleAdminRouteError(err, "خطا در ثبت نتیجه");
  }
}
