import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  await clearAdminSessionCookie();
  await writeAuditLog("ADMIN_LOGOUT");
  return NextResponse.json({ success: true });
}
