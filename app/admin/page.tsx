import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { isAdminAuthenticated } from "@/lib/auth-admin";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect("/admin/login");

  // Server-side fetch via prisma directly
  const { prisma } = await import("@/lib/db");
  const { MatchStatus, SmsStatus } = await import("@/generated/prisma");
  const { availableMatchWhere } = await import("@/lib/matches");
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

  const metrics = [
    { label: "کل کاربران", value: totalUsers },
    { label: "کل پیش‌بینی‌ها", value: totalPredictions },
    { label: "کل بازی‌ها", value: totalMatches },
    { label: "کل تیم‌ها", value: totalTeams },
    { label: "کل دعوت‌ها", value: totalReferrals },
    { label: "پیامک ارسال شده", value: smsSent },
    { label: "پیامک ناموفق", value: smsFailed },
    {
      label: "برترین کاربر",
      value: topUser ? `${topUser.firstName} ${topUser.lastName} (${topUser.points})` : "—",
    },
    { label: "شرکت‌کنندگان", value: totalUsers },
    { label: "بازی‌های قابل پیش‌بینی", value: availableMatches },
    { label: "بازی‌های قفل", value: lockedMatches },
    { label: "بازی‌های تمام شده", value: finishedMatches },
    { label: "بازی‌های لغو شده", value: cancelledMatches },
  ];

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold">داشبورد</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <AdminMetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>
    </AdminLayout>
  );
}
