import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import { getReferralLink } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    // Build the query where clause based on the search query
    let whereClause = {};
    if (q) {
      whereClause = {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { phone: { contains: q } },
          { referralCode: { contains: q } },
        ],
      };
    }

    const [users, totalCount, rules] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          _count: { select: { predictions: true } },
        },
        orderBy: { points: "desc" }, // Notice points is saved in DB, we can order by it directly in prisma
        skip: skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
      loadActivePointRulesMap(),
    ]);

    let result = users.map((u) => {
      // NOTE: We still compute score for display/correctness if there are live adjustments not yet in DB `points` column
      const computedScore = computeUserScore(
        {
        basePointsAwarded: u.basePointsAwarded,
        selfReferrerBonusAwarded: u.selfReferrerBonusAwarded,
        correctCount: u.correctCount,
          wrongCount: u.wrongCount,
          referralCount: u.referralCount,
        },
        rules
      );
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        referralCode: u.referralCode,
        referralLink: getReferralLink(u.referralCode),
        referredByCode: u.referredByCode,
        points: u.points, // Use the DB points directly to respect the Prisma sorting
        totalPredictions: u._count.predictions,
        correctPredictions: u.correctCount,
        wrongPredictions: u.wrongCount,
        referralCount: u.referralCount,
        hidden: u.hidden,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ 
      users: result,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
