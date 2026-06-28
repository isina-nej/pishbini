import { NextResponse } from "next/server";
import { AdminAuthError, adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { ReferralAdminError, adminChangeReferrer } from "@/lib/referral-admin";
import { getClientIp } from "@/lib/rate-limit";
import { adminChangeReferrerSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = adminChangeReferrerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const result = await adminChangeReferrer(id, parsed.data.referrerPhoneOrCode, ip);

    return NextResponse.json({
      success: true,
      message: result.transferred
        ? `معرف به ${result.referrerName} تغییر کرد و شمارش دعوت منتقل شد.`
        : `معرف به ${result.referrerName} تغییر کرد.`,
      ...result,
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return adminUnauthorizedResponse();
    }
    if (e instanceof ReferralAdminError) {
      const status =
        e.code === "NOT_FOUND"
          ? 404
          : e.code === "SAME_REFERRER"
            ? 409
            : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    console.error("[admin/change-referral]", e);
    return NextResponse.json({ error: "خطا در تغییر معرف" }, { status: 500 });
  }
}
