import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const minPoints = searchParams.get("minPoints");
    const maxPoints = searchParams.get("maxPoints");

    const where: Prisma.UserWhereInput = {};
    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { referralCode: { contains: q.toUpperCase() } },
      ];
    }
    if (minPoints || maxPoints) {
      where.points = {};
      if (minPoints) where.points.gte = Number(minPoints);
      if (maxPoints) where.points.lte = Number(maxPoints);
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            predictions: true,
            referralsMade: true,
          },
        },
        predictions: { select: { isCorrect: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const result = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      referralCode: u.referralCode,
      referredByCode: u.referredByCode,
      points: u.points,
      totalPredictions: u._count.predictions,
      correctPredictions: u.predictions.filter((p) => p.isCorrect === true).length,
      wrongPredictions: u.predictions.filter((p) => p.isCorrect === false).length,
      referralCount: u._count.referralsMade,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ users: result });
  } catch {
    return adminUnauthorizedResponse();
  }
}
