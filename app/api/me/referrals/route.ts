import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatPersianDateTime } from "@/lib/dates";
import { meUnauthorizedResponse, resolveUserIdInRouteHandler } from "@/lib/me-user";

export async function GET() {
  try {
    const userId = await resolveUserIdInRouteHandler();
    if (!userId) return meUnauthorizedResponse();

    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: userId },
      include: {
        referred: {
          select: { firstName: true, lastName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      referrals: referrals.map((r) => ({
        firstName: r.referred.firstName,
        lastName: r.referred.lastName,
        registeredAt: r.referred.createdAt.toISOString(),
        registeredAtLabel: formatPersianDateTime(r.referred.createdAt),
      })),
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت لیست دعوت‌شدگان" }, { status: 500 });
  }
}
