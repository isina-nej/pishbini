import { NextResponse } from "next/server";
import { getAuthenticatedUserId, userUnauthorizedResponse } from "@/lib/auth-user";
import { getUserProfile } from "@/lib/profile-service";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return userUnauthorizedResponse();

    const profile = await getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "حساب کاربری یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت پروفایل" }, { status: 500 });
  }
}
