import { NextResponse } from "next/server";
import {
  adminUnauthorizedResponse,
  requireAdmin,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "رمز عبور الزامی است" }, { status: 400 });
    }

    if (!verifyAdminPassword(parsed.data.password)) {
      return NextResponse.json({ error: "رمز عبور اشتباه است" }, { status: 401 });
    }

    await setAdminSessionCookie();
    await writeAuditLog("ADMIN_LOGIN");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در ورود" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ authenticated: true });
  } catch {
    return adminUnauthorizedResponse();
  }
}
