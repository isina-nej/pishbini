import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export async function writeAuditLog(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.adminAuditLog.create({
    data: {
      action,
      entityType,
      entityId,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}
