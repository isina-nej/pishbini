import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
  });
  try {
    const tables = await prisma.$queryRaw<{ Tables_in_worldcup_prediction: string }[]>`SHOW TABLES`;
    const migrations = await prisma.$queryRaw<
      { migration_name: string; finished_at: Date | null }[]
    >`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at`;
    const matchCols = await prisma.$queryRaw<{ Field: string }[]>`SHOW COLUMNS FROM \`Match\``;
    const userCols = await prisma.$queryRaw<{ Field: string }[]>`SHOW COLUMNS FROM \`User\``;
    console.log(
      JSON.stringify(
        {
          tables: tables.map((t) => t.Tables_in_worldcup_prediction),
          migrations,
          matchCols: matchCols.map((c) => c.Field),
          userCols: userCols.map((c) => c.Field),
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
