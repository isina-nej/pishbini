import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  PointRuleKey,
  PrismaClient,
  SmsStatus,
} from "../generated/prisma";
import { generateReferralCode } from "../lib/referral";
import { seedBracket } from "./seed-bracket";
import { seedWorldCup2026 } from "./seed-world-cup";

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  };
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaMariaDb(parseDatabaseUrl(url));
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const pointRules = [
    {
      key: PointRuleKey.BASE_REGISTRATION,
      label: "امتیاز ثبت‌نام",
      points: 200,
      description: "امتیاز پایه هنگام ثبت‌نام",
    },
    {
      key: PointRuleKey.CORRECT_PREDICTION,
      label: "پیش‌بینی درست",
      points: 10,
      description: "امتیاز پیش‌بینی صحیح",
    },
    {
      key: PointRuleKey.WRONG_PREDICTION,
      label: "پیش‌بینی نادرست",
      points: 3,
      description: "امتیاز پیش‌بینی اشتباه",
    },
    {
      key: PointRuleKey.REFERRAL_SUCCESS,
      label: "دعوت موفق",
      points: 30,
      description: "امتیاز دعوت دوست",
    },
    {
      key: PointRuleKey.SELF_REFERRER_CLAIM,
      label: "امتیاز ثبت دعوت‌کننده",
      points: 0,
      description: "امتیاز ثبت یک‌باره کد دعوت‌کننده در پروفایل",
    },
    {
      key: PointRuleKey.CANCELLED_MATCH,
      label: "بازی لغو شده",
      points: 0,
      description: "امتیاز بازی لغو شده",
    },
  ];

  for (const rule of pointRules) {
    await prisma.pointRule.upsert({
      where: { key: rule.key },
      create: { ...rule, active: true },
      update: { label: rule.label, description: rule.description, points: rule.points },
    });
  }

  await seedWorldCup2026(prisma);

  const existingUser = await prisma.user.findFirst();
  if (!existingUser) {
    await prisma.user.create({
      data: {
        firstName: "تست",
        lastName: "کاربر",
        phone: "09120000000",
        referralCode: generateReferralCode(),
        points: 200,
        basePointsAwarded: true,
      },
    });
  }

  const smsCount = await prisma.smsLog.count();
  if (smsCount === 0) {
    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.smsLog.create({
        data: {
          userId: user.id,
          phone: user.phone,
          message: "پیام تست",
          provider: "mock",
          status: SmsStatus.SENT,
          providerResponse: "seed",
        },
      });
    }
  }

  await seedBracket(prisma);

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
