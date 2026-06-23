import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatabaseUrl(url: string) {
  const parsed = new URL(url);
  if (!parsed.searchParams.has("connectionLimit")) {
    parsed.searchParams.set("connectionLimit", "10");
  }
  if (!parsed.searchParams.has("connectTimeout")) {
    parsed.searchParams.set("connectTimeout", "30000");
  }
  if (!parsed.searchParams.has("acquireTimeout")) {
    parsed.searchParams.set("acquireTimeout", "30000");
  }
  if (!parsed.searchParams.has("allowPublicKeyRetrieval")) {
    parsed.searchParams.set("allowPublicKeyRetrieval", "true");
  }
  return parsed.toString();
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaMariaDb(buildDatabaseUrl(url));
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Assign on globalThis during creation so parallel cold imports share one pool.
export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = createPrismaClient());
