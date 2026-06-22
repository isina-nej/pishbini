import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export type AuditActorType = "ADMIN" | "USER" | "SYSTEM";

export type AuditLogExtra = {
  actorType?: AuditActorType;
  actorUserId?: string;
  actorLabel?: string;
  ip?: string;
  summary?: string;
};

export async function writeAuditLog(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  extra?: AuditLogExtra
) {
  return prisma.adminAuditLog.create({
    data: {
      action,
      entityType,
      entityId,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      actorType: extra?.actorType ?? "ADMIN",
      actorUserId: extra?.actorUserId,
      actorLabel: extra?.actorLabel,
      ip: extra?.ip,
      summary: extra?.summary,
    },
  });
}

export async function logUserActivity(
  action: string,
  opts: {
    userId: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    summary: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
  }
) {
  const label =
    opts.firstName && opts.lastName
      ? `${opts.firstName} ${opts.lastName}`
      : opts.phone;

  return writeAuditLog(action, opts.entityType, opts.entityId, opts.metadata, {
    actorType: "USER",
    actorUserId: opts.userId,
    actorLabel: label,
    ip: opts.ip,
    summary: opts.summary,
  });
}
