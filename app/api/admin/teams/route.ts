import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";
import { teamSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const teams = await prisma.team.findMany({ orderBy: { nameFa: "asc" } });
    return NextResponse.json({ teams });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = teamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }
    const team = await prisma.team.create({ data: parsed.data });
    return NextResponse.json({ team }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "خطا در ایجاد تیم" }, { status: 500 });
  }
}
