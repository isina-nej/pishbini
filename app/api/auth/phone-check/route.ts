import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { authPhoneCheckSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateIp = checkRateLimit(`auth:phone-check:ip:${ip}`, 20, 60_000);
  if (!rateIp.allowed) {
    return NextResponse.json({ error: "تعداد درخواست‌ها بیش از حد مجاز است." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = authPhoneCheckSchema.safeParse(body);
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

    const ratePhone = checkRateLimit(`auth:phone-check:phone:${phone}`, 10, 60_000);
    if (!ratePhone.allowed) {
      return NextResponse.json({ error: "لطفاً کمی صبر کنید و دوباره تلاش کنید." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, hidden: true },
    });

    return NextResponse.json({
      registered: Boolean(user && !user.hidden),
    });
  } catch (err) {
    console.error("[auth/phone-check]", err);
    return NextResponse.json({ error: "خطا در بررسی شماره" }, { status: 500 });
  }
}
