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
import { ArrowRight, Save, Trash2, ScrollText, EyeOff, UserPlus, Link2 } from "lucide-react";

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
  const [assignInput, setAssignInput] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState(false);
  const [changeInput, setChangeInput] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeMessage, setChangeMessage] = useState<string | null>(null);
  const [changeError, setChangeError] = useState(false);
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

  const handleAssignReferral = async () => {
    setAssigning(true);
    setAssignMessage(null);
    setAssignError(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/assign-referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerPhoneOrCode: assignInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssignError(true);
        setAssignMessage(data.error ?? "خطا در ثبت معرف");
        return;
      }
      setAssignError(false);
      setAssignMessage(data.message ?? "معرف با موفقیت ثبت شد.");
      setAssignInput("");
      await load();
    } finally {
      setAssigning(false);
    }
  };

  const handleChangeReferral = async () => {
    setChanging(true);
    setChangeMessage(null);
    setChangeError(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/change-referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerPhoneOrCode: changeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChangeError(true);
        setChangeMessage(data.error ?? "خطا در تغییر معرف");
        return;
      }
      setChangeError(false);
      setChangeMessage(data.message ?? "معرف با موفقیت تغییر کرد.");
      setChangeInput("");
      await load();
    } finally {
      setChanging(false);
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
    referralsMade: Array<{
      createdAt: string;
      referred: { firstName: string; lastName: string; phone: string; createdAt: string };
    }>;
    referredRecord: {
      referralCode: string;
      createdAt: string;
      referrer: { firstName: string; lastName: string; referralCode: string };
    } | null;
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

      {u.referredRecord || u.referredByCode ? (
        <AdminCard className="mb-6">
          <AdminCardHeader title="معرف این کاربر" />
          <AdminCardBody className="space-y-3">
            {u.referredRecord ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <AdminBadge tone="primary">
                  <UserPlus className="size-3.5" />
                  {u.referredRecord.referrer.firstName} {u.referredRecord.referrer.lastName}
                </AdminBadge>
                <span className="text-[var(--admin-text-muted)]" dir="ltr">
                  کد: {u.referredRecord.referrer.referralCode}
                </span>
                <span className="text-xs text-[var(--admin-text-subtle)]">
                  ثبت دعوت: {formatPersianDateTime(u.referredRecord.createdAt)}
                </span>
              </div>
            ) : (
              <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-xs text-[var(--admin-text-muted)]">
                کد معرف ثبت‌شده:{" "}
                <span dir="ltr" className="font-mono text-[var(--admin-text)]">
                  {u.referredByCode}
                </span>
                {" — "}
                در انتظار اولین پیش‌بینی برای ثبت امتیاز
              </p>
            )}
            <p className="text-sm text-[var(--admin-text-muted)]">
              برای تغییر معرف، شماره موبایل یا کد دعوت معرف جدید را وارد کنید. در صورت ثبت
              دعوت قبلی، شمارش دعوت منتقل می‌شود.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminInput
                value={changeInput}
                onChange={(e) => setChangeInput(e.target.value)}
                placeholder="09123456789 یا ABC1234"
                dir="ltr"
                className="flex-1"
              />
              <AdminButton onClick={handleChangeReferral} disabled={changing || !changeInput.trim()}>
                <Link2 className="size-3.5" />
                {changing ? "در حال تغییر..." : "تغییر معرف"}
              </AdminButton>
            </div>
            {changeMessage && (
              <p
                className={`text-sm ${
                  changeError ? "text-[var(--admin-danger)]" : "text-[var(--admin-success)]"
                }`}
              >
                {changeMessage}
              </p>
            )}
          </AdminCardBody>
        </AdminCard>
      ) : (
        <AdminCard className="mb-6">
          <AdminCardHeader title="اختصاص دستی معرف" />
          <AdminCardBody className="space-y-3">
            {u.referredByCode && (
              <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-xs text-[var(--admin-text-muted)]">
                کد معرف ثبت‌شده:{" "}
                <span dir="ltr" className="font-mono text-[var(--admin-text)]">
                  {u.referredByCode}
                </span>
                {" — "}
                در انتظار اولین پیش‌بینی برای ثبت امتیاز
              </p>
            )}
            <p className="text-sm text-[var(--admin-text-muted)]">
              شماره موبایل یا کد دعوت معرف را وارد کنید.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminInput
                value={assignInput}
                onChange={(e) => setAssignInput(e.target.value)}
                placeholder="09123456789 یا ABC1234"
                dir="ltr"
                className="flex-1"
              />
              <AdminButton onClick={handleAssignReferral} disabled={assigning || !assignInput.trim()}>
                <Link2 className="size-3.5" />
                {assigning ? "در حال ثبت..." : "ثبت معرف"}
              </AdminButton>
            </div>
            {assignMessage && (
              <p
                className={`text-sm ${
                  assignError ? "text-[var(--admin-danger)]" : "text-[var(--admin-success)]"
                }`}
              >
                {assignMessage}
              </p>
            )}
          </AdminCardBody>
        </AdminCard>
      )}

      <AdminCard className="mb-6">
        <AdminCardHeader
          title="دعوت‌های موفق"
          description="کاربرانی که با لینک این شخص ثبت‌نام کرده‌اند"
        />
        <AdminCardBody className="overflow-x-auto">
          {u.referralsMade.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-muted)]">هنوز دعوت موفقی ثبت نشده است.</p>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-right text-xs text-[var(--admin-text-muted)]">
                  <th className="px-3 py-2 font-medium">نام</th>
                  <th className="px-3 py-2 font-medium">موبایل</th>
                  <th className="px-3 py-2 font-medium">تاریخ ثبت‌نام</th>
                  <th className="px-3 py-2 font-medium">تاریخ ثبت دعوت</th>
                </tr>
              </thead>
              <tbody>
                {u.referralsMade.map((r) => (
                  <tr
                    key={`${r.referred.phone}-${r.createdAt}`}
                    className="border-b border-[var(--admin-border)]/60 last:border-0"
                  >
                    <td className="px-3 py-2.5 font-medium">
                      {r.referred.firstName} {r.referred.lastName}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs" dir="ltr">
                      {r.referred.phone}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--admin-text-muted)]">
                      {formatPersianDateTime(r.referred.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--admin-text-muted)]">
                      {formatPersianDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
