import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { maskPhone } from "@/lib/masking";
import { createAndSendOtp } from "@/lib/otp-service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { otpSendSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateIp = checkRateLimit(`otp:send:ip:${ip}`, 10, 60_000);
  if (!rateIp.allowed) {
    return NextResponse.json({ error: "تعداد درخواست‌ها بیش از حد مجاز است." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = otpSendSchema.safeParse(body);
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

    const ratePhone = checkRateLimit(`otp:send:phone:${phone}`, 5, 60_000);
    if (!ratePhone.allowed) {
      return NextResponse.json(
        { error: "لطفاً کمی صبر کنید و دوباره تلاش کنید." },
        { status: 429 }
      );
    }

    const result = await createAndSendOtp(phone);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "خطا در ارسال کد" }, { status: 400 });
    }

    writeAuditLog("USER_OTP_REQUEST", undefined, undefined, { phone }, {
      actorType: "USER",
      actorLabel: maskPhone(phone),
      ip,
      summary: `درخواست کد تأیید برای ${maskPhone(phone)}`,
    }).catch(console.error);

    return NextResponse.json({ success: true, message: "کد تأیید ارسال شد." });
  } catch {
    return NextResponse.json({ error: "خطا در ارسال کد تأیید" }, { status: 500 });
  }
}
