import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/profile-service";
import { meUnauthorizedResponse, resolveUserIdFromCookies } from "@/lib/me-user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromCookies();
    if (!userId) return meUnauthorizedResponse();

    const profile = await getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "حساب کاربری یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت پروفایل" }, { status: 500 });
  }
}
