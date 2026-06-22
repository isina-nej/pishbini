"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminToggle } from "@/components/admin/ui/AdminToggle";
import { formatPersianDateTime } from "@/lib/dates";
import { ArrowRight, Save, Trash2, ScrollText, EyeOff } from "lucide-react";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [hidden, setHidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<
    Array<{ id: string; actionLabel: string; summary: string | null; createdAt: string }>
  >([]);

  const load = () =>
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setFirstName(d.user.firstName);
          setLastName(d.user.lastName);
          setPhone(d.user.phone);
          setHidden(Boolean(d.user.hidden));
        }
      });

  useEffect(() => {
    load();
    fetch(`/api/admin/audit-logs?userId=${id}&limit=15`)
      .then((r) => r.json())
      .then((d) => setActivity(d.logs ?? []));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, hidden }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ذخیره");
        return;
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("حذف دائمی این کاربر؟ تمام پیش‌بینی‌ها و داده‌های مرتبط پاک می‌شود.")) {
      return;
    }
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/users");
    else {
      const data = await res.json();
      setError(data.error ?? "خطا در حذف");
    }
  };

  if (!user) {
    return (
      <AdminLayout>
        <AdminLoading />
      </AdminLayout>
    );
  }

  const u = user as {
    referralCode: string;
    referredByCode: string | null;
    points: number;
    correctCount: number;
    wrongCount: number;
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

  return (
    <AdminLayout>
      <AdminPageHeader
        title={`${firstName} ${lastName}`}
        description={`کد دعوت: ${u.referralCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/audit-logs?userId=${id}`}>
              <AdminButton variant="outline" size="sm">
                <ScrollText className="size-3.5" />
                لاگ فعالیت
              </AdminButton>
            </Link>
            <Link href="/admin/users">
              <AdminButton variant="outline" size="sm">
                <ArrowRight className="size-3.5" />
                بازگشت
              </AdminButton>
            </Link>
          </div>
        }
      />

      {hidden && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--admin-warning)]/30 bg-[var(--admin-warning-soft)] px-4 py-3 text-sm text-[var(--admin-warning)]">
          <EyeOff className="size-4" />
          این کاربر مخفی است — در جدول امتیازات نمایش داده نمی‌شود و ثبت جدید محدود است.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <AdminMetricCard label="امتیاز" value={u.points} accent="primary" />
        <AdminMetricCard label="پیش‌بینی‌ها" value={u.predictions.length} />
        <AdminMetricCard label="درست" value={u.correctCount} accent="success" />
        <AdminMetricCard label="غلط" value={u.wrongCount} accent="danger" />
        <AdminMetricCard label="دعوت‌ها" value={u.referralsMade.length} accent="secondary" />
      </div>

      <AdminCard className="mb-6">
        <AdminCardHeader title="ویرایش کاربر" />
        <AdminCardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام">
              <AdminInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="نام خانوادگی">
              <AdminInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
            <Field label="موبایل" className="sm:col-span-2">
              <AdminInput value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </Field>
          </div>
          <AdminToggle
            label="مخفی کردن کاربر"
            description="حذف از لیدربرد و مسدودسازی ثبت جدید"
            checked={hidden}
            onChange={setHidden}
          />
          {error && <p className="text-sm text-[var(--admin-danger)]">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <AdminButton onClick={handleSave} disabled={saving}>
              <Save className="size-3.5" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </AdminButton>
            <AdminButton variant="danger" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
              حذف کاربر
            </AdminButton>
          </div>
        </AdminCardBody>
      </AdminCard>

      {activity.length > 0 && (
        <AdminCard className="mb-6">
          <AdminCardHeader title="آخرین فعالیت‌ها" />
          <AdminCardBody className="space-y-2">
            {activity.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{a.actionLabel}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{a.summary}</p>
                </div>
                <span className="text-xs text-[var(--admin-text-subtle)]">
                  {formatPersianDateTime(a.createdAt)}
                </span>
              </div>
            ))}
          </AdminCardBody>
        </AdminCard>
      )}

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

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
