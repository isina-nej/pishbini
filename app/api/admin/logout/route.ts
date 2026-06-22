import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  await clearAdminSessionCookie();
  try {
    await writeAuditLog("ADMIN_LOGOUT");
  } catch (err) {
    console.error("Failed to write admin logout audit log:", err);
  }
  return NextResponse.json({ success: true });
}
