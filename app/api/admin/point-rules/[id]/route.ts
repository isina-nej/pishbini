import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { handleAdminRouteError } from "@/lib/admin-route";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { pointRuleUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = pointRuleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }
    const rule = await prisma.pointRule.update({ where: { id }, data: parsed.data });
    await writeAuditLog("POINT_RULE_UPDATE", "PointRule", id, parsed.data);
    return NextResponse.json({ rule });
  } catch (err) {
    return handleAdminRouteError(err, "خطا در ویرایش قانون امتیاز");
  }
}
