import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setUserSessionCookie } from "@/lib/auth-user";
import { PARTICIPANT_COOKIE } from "@/lib/me-user";
import { processBracketSubmission } from "@/lib/bracket/submit-service";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { REFERRAL_COOKIE_NAME, resolveReferralCode } from "@/lib/referral";
import { bracketSubmitSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

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

    const cookieStore = await cookies();
    const referralFromCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const referralCode = resolveReferralCode(parsed.data.referralCode, referralFromCookie);

    const result = await processBracketSubmission({
      ...parsed.data,
      referralCode,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    cookieStore.set(PARTICIPANT_COOKIE, result.data.referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    const phone = normalizePhone(parsed.data.phone);
    if (phone) {
      const user = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });
      if (user) await setUserSessionCookie(user.id);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json({ error: "خطا در ثبت پیش‌بینی" }, { status: 500 });
  }
}
