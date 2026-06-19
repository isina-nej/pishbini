import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getLeaderboardData,
  getUserRankByReferralCode,
} from "@/lib/leaderboard-service";

const PARTICIPANT_COOKIE = "wc_participant";

export async function GET() {
  try {
    const users = await getLeaderboardData(10);
    const cookieStore = await cookies();
    const referralCode = cookieStore.get(PARTICIPANT_COOKIE)?.value;
    let currentUser = null;

    if (referralCode) {
      const rank = await getUserRankByReferralCode(referralCode);
      if (rank) {
        currentUser = {
          rank: rank.rank,
          fullName: rank.fullName,
          maskedPhone: rank.maskedPhone,
          points: rank.points,
          correctPredictions: rank.correctPredictions,
        };
      }
    }

    return NextResponse.json({
      users: users.map(({ userId: _, createdAt: __, ...u }) => u),
      currentUser,
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت جدول امتیازات" }, { status: 500 });
  }
}
