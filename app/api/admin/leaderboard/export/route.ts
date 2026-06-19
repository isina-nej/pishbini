import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { toCsv } from "@/lib/csv";
import { getLeaderboardData } from "@/lib/leaderboard-service";

export async function GET() {
  try {
    await requireAdmin();
    const users = await getLeaderboardData(100);
    const rows = users.map((u) => ({
      rank: u.rank,
      fullName: u.fullName,
      phone: u.maskedPhone,
      points: u.points,
      correctPredictions: u.correctPredictions,
    }));
    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leaderboard.csv"',
      },
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
