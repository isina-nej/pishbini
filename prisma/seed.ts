import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  MatchStatus,
  PointRuleKey,
  PointTransactionType,
  PrismaClient,
  SmsStatus,
} from "../generated/prisma";
import { generateReferralCode } from "../lib/referral";

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
      points: 1000,
      description: "امتیاز پیش‌بینی صحیح",
    },
    {
      key: PointRuleKey.WRONG_PREDICTION,
      label: "پیش‌بینی نادرست",
      points: -100,
      description: "امتیاز پیش‌بینی اشتباه",
    },
    {
      key: PointRuleKey.REFERRAL_SUCCESS,
      label: "دعوت موفق",
      points: 500,
      description: "امتیاز دعوت دوست",
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
      update: { label: rule.label, description: rule.description },
    });
  }

  const teams = [
    {
      nameFa: "ایران",
      nameEn: "Iran",
      code: "IRI",
      flagUrl: "https://flagcdn.com/w160/ir.png",
    },
    {
      nameFa: "پرتغال",
      nameEn: "Portugal",
      code: "POR",
      flagUrl: "https://flagcdn.com/w160/pt.png",
    },
    {
      nameFa: "آرژانتین",
      nameEn: "Argentina",
      code: "ARG",
      flagUrl: "https://flagcdn.com/w160/ar.png",
    },
    {
      nameFa: "برزیل",
      nameEn: "Brazil",
      code: "BRA",
      flagUrl: "https://flagcdn.com/w160/br.png",
    },
    {
      nameFa: "فرانسه",
      nameEn: "France",
      code: "FRA",
      flagUrl: "https://flagcdn.com/w160/fr.png",
    },
    {
      nameFa: "اسپانیا",
      nameEn: "Spain",
      code: "ESP",
      flagUrl: "https://flagcdn.com/w160/es.png",
    },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      create: { ...team, isActive: true },
      update: { nameFa: team.nameFa, nameEn: team.nameEn, flagUrl: team.flagUrl },
    });
  }

  const iran = await prisma.team.findUnique({ where: { code: "IRI" } });
  const portugal = await prisma.team.findUnique({ where: { code: "POR" } });
  const argentina = await prisma.team.findUnique({ where: { code: "ARG" } });
  const brazil = await prisma.team.findUnique({ where: { code: "BRA" } });

  if (iran && portugal && argentina && brazil) {
    const now = new Date();
    const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const in20h = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const in30h = new Date(now.getTime() + 30 * 60 * 60 * 1000);

    const sampleMatches = [
      { homeTeamId: iran.id, awayTeamId: portugal.id, startTime: in12h, status: MatchStatus.ACTIVE },
      { homeTeamId: argentina.id, awayTeamId: brazil.id, startTime: in20h, status: MatchStatus.SCHEDULED },
      { homeTeamId: portugal.id, awayTeamId: argentina.id, startTime: in30h, status: MatchStatus.SCHEDULED },
    ];

    for (const m of sampleMatches) {
      const existing = await prisma.match.findFirst({
        where: {
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          startTime: m.startTime,
        },
      });
      if (!existing) {
        await prisma.match.create({ data: m });
      }
    }
  }

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

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
