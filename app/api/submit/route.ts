import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setUserSessionCookie } from "@/lib/auth-user";
import { PARTICIPANT_COOKIE, resolveUserIdFromCookies } from "@/lib/me-user";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { verifyOtp } from "@/lib/otp-service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { REFERRAL_COOKIE_NAME, resolveReferralCode } from "@/lib/referral";
import { processSubmission } from "@/lib/submit-service";
import {
  nameSchema,
  phoneInputSchema,
  predictionItemSchema,
  submitSchema,
} from "@/lib/validation";

const authenticatedSubmitSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneInputSchema,
  predictions: z.array(predictionItemSchema).min(1, "حداقل یک پیش‌بینی لازم است"),
  referralCode: z.string().nullable().optional(),
});

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

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
    const sessionUserId = await resolveUserIdFromCookies();
    const phone = normalizePhone(body.phone);
    let useSession = false;

    if (sessionUserId && phone && !body.code) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { phone: true },
      });
      useSession = sessionUser?.phone === phone;
    }

    const parsed = useSession
      ? authenticatedSubmitSchema.safeParse(body)
      : submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    if (!useSession) {
      const otp = await verifyOtp(parsed.data.phone, (body as { code: string }).code);
      if (!otp.valid) {
        return NextResponse.json({ error: otp.error ?? "کد تأیید نامعتبر است." }, { status: 400 });
      }
    }

    const cookieStore = await cookies();
    const referralFromCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const referralCode = resolveReferralCode(parsed.data.referralCode, referralFromCookie);

    const result = await processSubmission({
      ...parsed.data,
      referralCode,
      code: useSession ? "0000" : (body as { code: string }).code,
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

    const normalizedPhone = normalizePhone(parsed.data.phone);
    if (normalizedPhone) {
      const user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      if (user) await setUserSessionCookie(user.id);
    }

    return NextResponse.json({ success: true, user: result.data });
  } catch {
    return NextResponse.json({ error: "خطا در ثبت پیش‌بینی" }, { status: 500 });
  }
}
