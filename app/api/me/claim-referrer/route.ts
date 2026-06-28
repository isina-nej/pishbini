import { NextResponse } from "next/server";
import { meUnauthorizedResponse, resolveUserIdInRouteHandler } from "@/lib/me-user";
import { ReferralClaimError, claimReferrerByUser } from "@/lib/referral-claim";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { claimReferrerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const userId = await resolveUserIdInRouteHandler();
    if (!userId) return meUnauthorizedResponse();

    const rate = checkRateLimit(`claim-referrer:user:${userId}`, 5, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "لطفاً کمی صبر کنید و دوباره تلاش کنید." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = claimReferrerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const result = await claimReferrerByUser(userId, parsed.data.referralCode, ip);

    return NextResponse.json({
      success: true,
      message:
        result.pointsEarned > 0
          ? `دعوت‌کننده ثبت شد. ${result.pointsEarned.toLocaleString("fa-IR")} امتیاز دریافت کردید.`
          : "دعوت‌کننده با موفقیت ثبت شد.",
      ...result,
    });
  } catch (e) {
    if (e instanceof ReferralClaimError) {
      const status =
        e.code === "NOT_FOUND"
          ? 404
          : e.code === "ALREADY_HAS_REFERRER"
            ? 409
            : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    console.error("[me/claim-referrer]", e);
    return NextResponse.json({ error: "خطا در ثبت دعوت‌کننده" }, { status: 500 });
  }
}
