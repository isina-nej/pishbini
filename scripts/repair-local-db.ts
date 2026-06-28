#!/usr/bin/env npx tsx
/**
 * Repair local DB when prisma migrate is stuck (idempotent).
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma";

const MIGRATIONS = [
  "20260622120000_bracket_tables",
  "20260623120000_otp_user_stats",
  "20260624120000_user_hidden_audit_log",
  "20260625120000_push_subscriptions",
  "20260626120000_user_push_opt_in",
  "20260627120000_match_result_scores",
  "20260628120000_self_referrer_claim",
];

async function columnExists(prisma: PrismaClient, table: string, column: string) {
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) as c FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND LOWER(TABLE_NAME) = LOWER(${table})
      AND COLUMN_NAME = ${column}
  `;
  return Number(rows[0]?.c ?? 0) > 0;
}

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) as c FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(${table})
  `;
  return Number(rows[0]?.c ?? 0) > 0;
}

async function safeAddColumn(prisma: PrismaClient, sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("Duplicate column")) throw e;
  }
}

async function migrationFinished(prisma: PrismaClient, name: string) {
  const rows = await prisma.$queryRaw<{ finished_at: Date | null }[]>`
    SELECT finished_at FROM _prisma_migrations WHERE migration_name = ${name} LIMIT 1
  `;
  return rows[0]?.finished_at != null;
}

async function markMigration(prisma: PrismaClient, name: string) {
  const existing = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name FROM _prisma_migrations WHERE migration_name = ${name} LIMIT 1
  `;
  if (existing.length === 0) {
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (UUID(), '', NOW(3), ${name}, NULL, NULL, NOW(3), 1)
    `;
    return;
  }
  await prisma.$executeRaw`
    UPDATE _prisma_migrations SET finished_at = NOW(3), rolled_back_at = NULL, logs = NULL
    WHERE migration_name = ${name}
  `;
}

async function applyIdempotentPatches(prisma: PrismaClient) {
  await safeAddColumn(
    prisma,
    "ALTER TABLE `Match` ADD COLUMN `predictionWindowNotifiedAt` DATETIME(3) NULL"
  );
  if (!(await columnExists(prisma, "Match", "homeScore"))) {
    await prisma.$executeRaw`
      ALTER TABLE \`Match\`
        ADD COLUMN \`homeScore\` INTEGER NULL,
        ADD COLUMN \`awayScore\` INTEGER NULL,
        ADD COLUMN \`resultUpdatedAt\` DATETIME(3) NULL,
        ADD COLUMN \`settlementPushScheduledAt\` DATETIME(3) NULL,
        ADD COLUMN \`settlementPushSentAt\` DATETIME(3) NULL
    `;
  }
  await safeAddColumn(
    prisma,
    "ALTER TABLE `User` ADD COLUMN `selfReferrerBonusAwarded` BOOLEAN NOT NULL DEFAULT false"
  );
  if (!(await tableExists(prisma, "PushSubscription"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`PushSubscription\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NOT NULL,
        \`endpoint\` VARCHAR(768) NOT NULL,
        \`p256dh\` VARCHAR(191) NOT NULL,
        \`auth\` VARCHAR(191) NOT NULL,
        \`userAgent\` TEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`PushSubscription_endpoint_key\`(\`endpoint\`),
        INDEX \`PushSubscription_userId_idx\`(\`userId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`PushSubscription\` ADD CONSTRAINT \`PushSubscription_userId_fkey\`
      FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
  // Ensure enum + point rule for self referrer
  try {
    await prisma.$executeRaw`
      ALTER TABLE \`PointRule\` MODIFY \`key\` ENUM(
        'BASE_REGISTRATION', 'CORRECT_PREDICTION', 'WRONG_PREDICTION',
        'REFERRAL_SUCCESS', 'SELF_REFERRER_CLAIM', 'CANCELLED_MATCH'
      ) NOT NULL
    `;
  } catch {
    /* already applied */
  }
  try {
    await prisma.$executeRaw`
      ALTER TABLE \`PointTransaction\` MODIFY \`type\` ENUM(
        'BASE_REGISTRATION', 'CORRECT_PREDICTION', 'WRONG_PREDICTION',
        'REFERRAL_SUCCESS', 'SELF_REFERRER_CLAIM', 'ADMIN_ADJUSTMENT', 'RESETTLEMENT'
      ) NOT NULL
    `;
  } catch {
    /* already applied */
  }
  await prisma.$executeRaw`
    INSERT INTO \`PointRule\` (\`id\`, \`key\`, \`label\`, \`points\`, \`active\`, \`description\`, \`createdAt\`, \`updatedAt\`)
    SELECT UUID(), 'SELF_REFERRER_CLAIM', 'امتیاز ثبت دعوت‌کننده', 0, true,
      'امتیاز ثبت یک‌باره کد دعوت‌کننده در پروفایل', NOW(3), NOW(3)
    FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM \`PointRule\` WHERE \`key\` = 'SELF_REFERRER_CLAIM')
  `;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
  });
  try {
    await applyIdempotentPatches(prisma);
    for (const name of MIGRATIONS) {
      if (!(await migrationFinished(prisma, name))) {
        await markMigration(prisma, name);
        console.log(`marked applied: ${name}`);
      }
    }
    console.log("DB repair complete");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
