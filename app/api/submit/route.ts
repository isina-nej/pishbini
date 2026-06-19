import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { processSubmission } from "@/lib/submit-service";
import { submitSchema } from "@/lib/validation";

const PARTICIPANT_COOKIE = "wc_participant";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`submit:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد مجاز است." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const result = await processSubmission(parsed.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const cookieStore = await cookies();
    cookieStore.set(PARTICIPANT_COOKIE, result.data.referralCode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return NextResponse.json({ success: true, user: result.data });
  } catch {
    return NextResponse.json({ error: "خطا در ثبت پیش‌بینی" }, { status: 500 });
  }
}
