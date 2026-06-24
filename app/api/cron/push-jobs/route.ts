import { NextResponse } from "next/server";
import { notifyNewPredictionWindows } from "@/lib/push-notifications";
import { isPushConfigured } from "@/lib/push-service";

export const dynamic = "force-dynamic";

function verifyCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ skipped: true, reason: "VAPID not configured" });
  }

  try {
    const result = await notifyNewPredictionWindows();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[cron/push-jobs]", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
