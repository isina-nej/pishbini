import { NextResponse } from "next/server";
import { MatchStatus, SmsStatus } from "@/generated/prisma";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/db";
import { availableMatchWhere } from "@/lib/matches";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();

    const [
      totalUsers,
      totalPredictions,
      totalMatches,
      totalTeams,
      totalReferrals,
      smsSent,
      smsFailed,
      topUser,
      availableMatches,
      lockedMatches,
      finishedMatches,
      cancelledMatches,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.prediction.count(),
      prisma.match.count(),
      prisma.team.count(),
      prisma.referral.count(),
      prisma.smsLog.count({ where: { status: SmsStatus.SENT } }),
      prisma.smsLog.count({ where: { status: SmsStatus.FAILED } }),
      prisma.user.findFirst({ orderBy: { points: "desc" } }),
      prisma.match.count({ where: availableMatchWhere(now) }),
      prisma.match.count({ where: { status: MatchStatus.LOCKED } }),
      prisma.match.count({ where: { status: MatchStatus.FINISHED } }),
      prisma.match.count({ where: { status: MatchStatus.CANCELLED } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalPredictions,
      totalMatches,
      totalTeams,
      totalReferrals,
      totalSmsSent: smsSent,
      totalSmsFailed: smsFailed,
      currentTopUser: topUser
        ? { name: `${topUser.firstName} ${topUser.lastName}`, points: topUser.points }
        : null,
      totalCampaignParticipants: totalUsers,
      availableMatches,
      lockedMatches,
      finishedMatches,
      cancelledMatches,
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
