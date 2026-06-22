import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { getLeaderboardData } from "@/lib/leaderboard-service";
import { availableMatchWhere } from "@/lib/matches";
import { MatchStatus, SmsStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";

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
      availableMatches,
      lockedMatches,
      finishedMatches,
      cancelledMatches,
      leaderboardTop,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.prediction.count(),
      prisma.match.count(),
      prisma.team.count(),
      prisma.referral.count(),
      prisma.smsLog.count({ where: { status: SmsStatus.SENT } }),
      prisma.smsLog.count({ where: { status: SmsStatus.FAILED } }),
      prisma.match.count({ where: availableMatchWhere(now) }),
      prisma.match.count({ where: { status: MatchStatus.LOCKED } }),
      prisma.match.count({ where: { status: MatchStatus.FINISHED } }),
      prisma.match.count({ where: { status: MatchStatus.CANCELLED } }),
      getLeaderboardData(1),
    ]);

    const topUser = leaderboardTop[0] ?? null;

    return NextResponse.json({
      totalUsers,
      totalPredictions,
      totalMatches,
      totalTeams,
      totalReferrals,
      totalSmsSent: smsSent,
      totalSmsFailed: smsFailed,
      currentTopUser: topUser
        ? { name: topUser.fullName, points: topUser.points }
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
