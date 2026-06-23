import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "@/lib/auth-user";

export async function POST() {
  await clearUserSessionCookie();
  return NextResponse.json({ success: true });
}
