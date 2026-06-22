import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { handleAdminRouteError } from "@/lib/admin-route";
import { prisma } from "@/lib/db";
import { matchSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const matches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true, _count: { select: { predictions: true } } },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json({ matches });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }
    if (parsed.data.homeTeamId === parsed.data.awayTeamId) {
      return NextResponse.json({ error: "تیم‌ها نمی‌توانند یکسان باشند" }, { status: 400 });
    }
    const match = await prisma.match.create({
      data: {
        homeTeamId: parsed.data.homeTeamId,
        awayTeamId: parsed.data.awayTeamId,
        startTime: new Date(parsed.data.startTime),
        status: parsed.data.status,
        predictionMode: parsed.data.predictionMode,
      },
      include: { homeTeam: true, awayTeam: true },
    });
    return NextResponse.json({ match }, { status: 201 });
  } catch (err) {
    return handleAdminRouteError(err, "خطا در ایجاد بازی");
  }
}
