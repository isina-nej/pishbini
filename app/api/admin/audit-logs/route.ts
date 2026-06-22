import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { getAuditActionLabel } from "@/lib/audit-labels";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const action = searchParams.get("action")?.trim();
    const actorType = searchParams.get("actorType")?.trim();
    const userId = searchParams.get("userId")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") ?? 50)));
    const skip = (page - 1) * limit;

    const where: Prisma.AdminAuditLogWhereInput = {};
    if (action) where.action = action;
    if (actorType) where.actorType = actorType;
    if (userId) where.actorUserId = userId;
    if (q) {
      where.OR = [
        { summary: { contains: q } },
        { actorLabel: { contains: q } },
        { action: { contains: q } },
        { entityId: { contains: q } },
      ];
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [logs, total, actionGroups, actorGroups, todayCount, todayUserCount] =
      await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.groupBy({
        by: ["action"],
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
        take: 12,
      }),
      prisma.adminAuditLog.groupBy({
        by: ["actorType"],
        _count: { actorType: true },
      }),
      prisma.adminAuditLog.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.adminAuditLog.count({
        where: { createdAt: { gte: todayStart }, actorType: "USER" },
      }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        actionLabel: getAuditActionLabel(log.action),
        actorType: log.actorType,
        actorUserId: log.actorUserId,
        actorLabel: log.actorLabel,
        entityType: log.entityType,
        entityId: log.entityId,
        summary: log.summary,
        ip: log.ip,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        todayCount,
        todayUserCount,
        byAction: actionGroups.map((g) => ({
          action: g.action,
          label: getAuditActionLabel(g.action),
          count: g._count.action,
        })),
        byActor: actorGroups.map((g) => ({
          actorType: g.actorType,
          count: g._count.actorType,
        })),
      },
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
