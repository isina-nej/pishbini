import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";
import { matchSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });
    if (!match) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    return NextResponse.json({ match });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = matchSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startTime) data.startTime = new Date(parsed.data.startTime);
    const match = await prisma.match.update({
      where: { id },
      data,
      include: { homeTeam: true, awayTeam: true },
    });
    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: "خطا در ویرایش بازی" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const count = await prisma.prediction.count({ where: { matchId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: "این بازی پیش‌بینی دارد و قابل حذف نیست." },
        { status: 400 }
      );
    }
    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در حذف بازی" }, { status: 500 });
  }
}
