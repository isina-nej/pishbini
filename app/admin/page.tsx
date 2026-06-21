import Link from "next/link";
import {
  Users,
  Target,
  Calendar,
  Shield,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  Trophy,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminMetricCard, AdminSection } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/AdminCard";
import { isAdminAuthenticated } from "@/lib/auth-admin";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect("/admin/login");

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

  const quickLinks = [
    { href: "/admin/matches", label: "مدیریت بازی‌ها" },
    { href: "/admin/users", label: "شرکت‌کنندگان" },
    { href: "/admin/leaderboard", label: "جدول امتیازات" },
    { href: "/admin/bracket", label: "جدول حذفی" },
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="داشبورد"
        description="نمای کلی کمپین پیش‌بینی جام جهانی"
      />

      <AdminSection title="آمار کلی">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <AdminMetricCard label="شرکت‌کنندگان" value={totalUsers} icon={Users} accent="primary" />
          <AdminMetricCard label="پیش‌بینی‌ها" value={totalPredictions} icon={Target} accent="secondary" />
          <AdminMetricCard label="دعوت‌های موفق" value={totalReferrals} icon={UserPlus} accent="success" />
          <AdminMetricCard label="تیم‌ها" value={totalTeams} icon={Shield} accent="warning" />
        </div>
      </AdminSection>

      <AdminSection title="وضعیت بازی‌ها">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          <AdminMetricCard label="کل بازی‌ها" value={totalMatches} icon={Calendar} />
          <AdminMetricCard label="قابل پیش‌بینی" value={availableMatches} icon={Clock} accent="primary" />
          <AdminMetricCard label="قفل شده" value={lockedMatches} icon={Lock} accent="warning" />
          <AdminMetricCard label="تمام شده" value={finishedMatches} icon={CheckCircle} accent="success" />
          <AdminMetricCard label="لغو شده" value={cancelledMatches} icon={XCircle} accent="danger" />
        </div>
      </AdminSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <AdminCardBody>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-[var(--admin-warning)]" />
              <h3 className="font-semibold">برترین کاربر</h3>
            </div>
            {topUser ? (
              <div className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-4">
                <div>
                  <p className="font-bold">
                    {topUser.firstName} {topUser.lastName}
                  </p>
                  <p className="text-xs text-[var(--admin-text-muted)]" dir="ltr">
                    {topUser.referralCode}
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums text-[var(--admin-primary)]">
                  {topUser.points.toLocaleString("fa-IR")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--admin-text-muted)]">هنوز کاربری ثبت نشده</p>
            )}
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardBody>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="size-5 text-[var(--admin-secondary)]" />
              <h3 className="font-semibold">پیامک</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--admin-text-muted)]">ارسال موفق</span>
                <span className="font-bold text-[var(--admin-success)]">
                  {smsSent.toLocaleString("fa-IR")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--admin-text-muted)]">ناموفق</span>
                <span className="font-bold text-[var(--admin-danger)]">
                  {smsFailed.toLocaleString("fa-IR")}
                </span>
              </div>
            </div>
          </AdminCardBody>
        </AdminCard>
      </div>

      <AdminSection title="دسترسی سریع">
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <AdminButton variant="outline" size="sm">
                {link.label}
              </AdminButton>
            </Link>
          ))}
        </div>
      </AdminSection>

      {(smsFailed > 0 || availableMatches === 0) && (
        <AdminCard className="mt-2 border-[var(--admin-warning)]/30">
          <AdminCardBody className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--admin-warning)]" />
            <div className="text-sm">
              {availableMatches === 0 && (
                <p className="text-[var(--admin-text-muted)]">
                  در حال حاضر بازی فعالی برای پیش‌بینی وجود ندارد.
                </p>
              )}
              {smsFailed > 0 && (
                <p className="text-[var(--admin-warning)]">
                  {smsFailed.toLocaleString("fa-IR")} پیامک با خطا مواجه شده است.
                </p>
              )}
            </div>
          </AdminCardBody>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
