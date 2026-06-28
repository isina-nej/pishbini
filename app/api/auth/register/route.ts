import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logUserActivity } from "@/lib/audit";
import { createUserFromAuth } from "@/lib/auth-register";
import { setUserSessionCookie } from "@/lib/auth-user";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp-service";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { REFERRAL_COOKIE_NAME, resolveReferralCode } from "@/lib/referral";
import { authRegisterSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateIp = checkRateLimit(`auth:register:ip:${ip}`, 15, 60_000);
  if (!rateIp.allowed) {
    return NextResponse.json({ error: "تعداد درخواست‌ها بیش از حد مجاز است." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = authRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json({ error: "شماره موبایل معتبر نیست." }, { status: 400 });
    }

    const ratePhone = checkRateLimit(`auth:register:phone:${phone}`, 8, 60_000);
    if (!ratePhone.allowed) {
      return NextResponse.json({ error: "لطفاً کمی صبر کنید و دوباره تلاش کنید." }, { status: 429 });
    }

    const otp = await verifyOtp(phone, parsed.data.code);
    if (!otp.valid) {
      return NextResponse.json({ error: otp.error ?? "کد تأیید نامعتبر است." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, hidden: true },
    });

    if (existing?.hidden) {
      return NextResponse.json(
        { error: "حساب شما غیرفعال شده است." },
        { status: 403 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "این شماره قبلاً ثبت شده است. وارد شوید." },
        { status: 409 }
      );
    }

    const cookieStore = await cookies();
    const referralFromCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const referredByCode = resolveReferralCode(parsed.data.referralCode, referralFromCookie);

    const user = await createUserFromAuth({
      phone,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      referredByCode,
    });

    await setUserSessionCookie(user.id);

    logUserActivity("USER_REGISTER", {
      userId: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      summary: `ثبت‌نام کاربر: ${user.firstName} ${user.lastName}`,
      metadata: { referredByCode: referredByCode || null },
      ip,
    }).catch(console.error);

    return NextResponse.json({ success: true, message: "ثبت‌نام موفق." });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "خطا در ثبت‌نام" }, { status: 500 });
  }
}
