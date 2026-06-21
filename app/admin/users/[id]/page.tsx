"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { formatPersianDateTime } from "@/lib/dates";
import { ArrowRight } from "lucide-react";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, [id]);

  if (!user) {
    return (
      <AdminLayout>
        <AdminLoading />
      </AdminLayout>
    );
  }

  const u = user as {
    firstName: string;
    lastName: string;
    phone: string;
    referralCode: string;
    referredByCode: string | null;
    points: number;
    predictions: Array<{
      prediction: string;
      isCorrect: boolean | null;
      pointsAwarded: number;
      match: { homeTeam: { nameFa: string }; awayTeam: { nameFa: string } };
    }>;
    smsLogs: Array<{ message: string; status: string; createdAt: string }>;
    pointTransactions: Array<{ type: string; points: number; reason: string | null; createdAt: string }>;
    referralsMade: Array<{ referred: { firstName: string; lastName: string } }>;
  };

  const correctCount = u.predictions.filter((p) => p.isCorrect === true).length;

  return (
    <AdminLayout>
      <AdminPageHeader
        title={`${u.firstName} ${u.lastName}`}
        description={`کد دعوت: ${u.referralCode}`}
        actions={
          <Link href="/admin/users">
            <AdminButton variant="outline" size="sm">
              <ArrowRight className="size-3.5" />
              بازگشت
            </AdminButton>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminMetricCard label="امتیاز" value={u.points} accent="primary" />
        <AdminMetricCard label="پیش‌بینی‌ها" value={u.predictions.length} />
        <AdminMetricCard label="درست" value={correctCount} accent="success" />
        <AdminMetricCard label="دعوت‌ها" value={u.referralsMade.length} accent="secondary" />
      </div>

      <div className="mb-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 text-sm">
        <p dir="ltr" className="font-mono text-[var(--admin-text-muted)]">{u.phone}</p>
        {u.referredByCode && (
          <p className="mt-1 text-[var(--admin-text-subtle)]">
            دعوت‌شده با کد: <span dir="ltr">{u.referredByCode}</span>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="پیش‌بینی‌ها" />
          <AdminCardBody className="max-h-80 space-y-2 overflow-y-auto">
            {u.predictions.length === 0 ? (
              <p className="text-sm text-[var(--admin-text-muted)]">بدون پیش‌بینی</p>
            ) : (
              u.predictions.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-3 text-sm"
                >
                  <p className="font-medium">
                    {p.match.homeTeam.nameFa} vs {p.match.awayTeam.nameFa}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[var(--admin-text-muted)]">{p.prediction}</span>
                    {p.isCorrect !== null && (
                      <AdminBadge tone={p.isCorrect ? "success" : "danger"}>
                        {p.isCorrect ? `+${p.pointsAwarded}` : p.pointsAwarded}
                      </AdminBadge>
                    )}
                  </div>
                </div>
              ))
            )}
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="تراکنش‌های امتیاز" />
          <AdminCardBody className="max-h-80 space-y-2 overflow-y-auto">
            {u.pointTransactions.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-xs text-[var(--admin-text-subtle)]" dir="ltr">{t.type}</p>
                  <p className="text-[var(--admin-text-muted)]">{t.reason}</p>
                </div>
                <span
                  className={`font-bold tabular-nums ${
                    t.points >= 0 ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"
                  }`}
                >
                  {t.points > 0 ? "+" : ""}
                  {t.points}
                </span>
              </div>
            ))}
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title={`دعوت‌ها (${u.referralsMade.length})`} />
          <AdminCardBody className="space-y-2">
            {u.referralsMade.length === 0 ? (
              <p className="text-sm text-[var(--admin-text-muted)]">بدون دعوت</p>
            ) : (
              u.referralsMade.map((r, i) => (
                <p key={i} className="text-sm">
                  {r.referred.firstName} {r.referred.lastName}
                </p>
              ))
            )}
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="پیامک‌ها" />
          <AdminCardBody className="max-h-60 space-y-2 overflow-y-auto">
            {u.smsLogs.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <AdminBadge tone={s.status === "SENT" ? "success" : "danger"}>{s.status}</AdminBadge>
                <span className="text-xs text-[var(--admin-text-subtle)]">
                  {formatPersianDateTime(s.createdAt)}
                </span>
              </div>
            ))}
          </AdminCardBody>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
