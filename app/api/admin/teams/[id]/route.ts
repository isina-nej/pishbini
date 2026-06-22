import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { handleAdminRouteError } from "@/lib/admin-route";
import { prisma } from "@/lib/db";
import { teamSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = teamSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }
    const team = await prisma.team.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ team });
  } catch (err) {
    return handleAdminRouteError(err, "خطا در ویرایش تیم");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const used = await prisma.match.count({
      where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
    });
    if (used > 0) {
      return NextResponse.json(
        { error: "این تیم در بازی‌ها استفاده شده و قابل حذف نیست." },
        { status: 400 }
      );
    }
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAdminRouteError(err, "خطا در حذف تیم");
  }
}
