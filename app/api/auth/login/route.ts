import { NextResponse } from "next/server";
import { logUserActivity } from "@/lib/audit";
import { setUserSessionCookie } from "@/lib/auth-user";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp-service";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { authLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateIp = checkRateLimit(`auth:login:ip:${ip}`, 15, 60_000);
  if (!rateIp.allowed) {
    return NextResponse.json({ error: "تعداد درخواست‌ها بیش از حد مجاز است." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = authLoginSchema.safeParse(body);
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

    const ratePhone = checkRateLimit(`auth:login:phone:${phone}`, 8, 60_000);
    if (!ratePhone.allowed) {
      return NextResponse.json({ error: "لطفاً کمی صبر کنید و دوباره تلاش کنید." }, { status: 429 });
    }

    const otp = await verifyOtp(phone, parsed.data.code);
    if (!otp.valid) {
      return NextResponse.json({ error: otp.error ?? "کد تأیید نامعتبر است." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "حسابی با این شماره یافت نشد. ابتدا از صفحه پیش‌بینی ثبت‌نام کنید.",
        },
        { status: 404 }
      );
    }

    await setUserSessionCookie(user.id);

    logUserActivity("USER_LOGIN", {
      userId: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      summary: `ورود کاربر: ${user.firstName} ${user.lastName}`,
      ip,
    }).catch(console.error);

    return NextResponse.json({ success: true, message: "ورود موفق." });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "خطا در ورود" }, { status: 500 });
  }
}
