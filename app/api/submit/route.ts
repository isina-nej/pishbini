import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { REFERRAL_COOKIE_NAME, resolveReferralCode } from "@/lib/referral";
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

    const otp = await verifyOtp(parsed.data.phone, parsed.data.code);
    if (!otp.valid) {
      return NextResponse.json({ error: otp.error ?? "کد تأیید نامعتبر است." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const referralFromCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const referralCode = resolveReferralCode(parsed.data.referralCode, referralFromCookie);

    const result = await processSubmission({
      ...parsed.data,
      referralCode,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

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
