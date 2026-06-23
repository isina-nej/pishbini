import { NextResponse } from "next/server";
import { getLeaderboardData, PUBLIC_LEADERBOARD_LIMIT } from "@/lib/leaderboard-service";

export async function GET() {
  try {
    const users = await getLeaderboardData(PUBLIC_LEADERBOARD_LIMIT);

    return NextResponse.json({
      users: users.map(({ userId: _, createdAt: __, ...u }) => u),
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت جدول امتیازات" }, { status: 500 });
  }
}
