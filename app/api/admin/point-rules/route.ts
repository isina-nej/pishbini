import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const rules = await prisma.pointRule.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ rules });
  } catch {
    return adminUnauthorizedResponse();
  }
}
