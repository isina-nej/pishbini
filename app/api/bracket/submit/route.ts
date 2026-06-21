import { NextResponse } from "next/server";
import { processBracketSubmission } from "@/lib/bracket/submit-service";
import { bracketSubmitSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`bracket-submit:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد مجاز است." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = bracketSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const result = await processBracketSubmission(parsed.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json({ error: "خطا در ثبت پیش‌بینی" }, { status: 500 });
  }
}
