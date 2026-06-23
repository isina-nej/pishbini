import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "@/lib/auth-user";
import { PARTICIPANT_COOKIE } from "@/lib/me-user";

export async function POST() {
  await clearUserSessionCookie();
  const cookieStore = await cookies();
  cookieStore.delete(PARTICIPANT_COOKIE);
  return NextResponse.json({ success: true });
}
