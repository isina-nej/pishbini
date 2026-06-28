import { NextResponse } from "next/server";
import { AdminAuthError, adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { ReferralAdminError, adminAssignReferral } from "@/lib/referral-admin";
import { getClientIp } from "@/lib/rate-limit";
import { adminAssignReferralSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = adminAssignReferralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const result = await adminAssignReferral(id, parsed.data.referrerPhoneOrCode, ip);

    return NextResponse.json({
      success: true,
      message: result.awarded
        ? `معرف ${result.referrerName} ثبت شد و امتیاز دعوت اعمال گردید.`
        : `معرف ${result.referrerName} ثبت شد. امتیاز در اولین پیش‌بینی داده می‌شود.`,
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
          : e.code === "ALREADY_REFERRED"
            ? 409
            : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    console.error("[admin/assign-referral]", e);
    return NextResponse.json({ error: "خطا در ثبت معرف" }, { status: 500 });
  }
}
