"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminMetricCard, AdminSection } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminToggle } from "@/components/admin/ui/AdminToggle";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { GitBranch, AlertCircle, CheckCircle2, Upload } from "lucide-react";

type Config = {
  enabled: boolean;
  published: boolean;
  submissionOpen: boolean;
};

export default function AdminBracketPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [errors, setErrors] = useState<{ message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/bracket")
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.config);
        setMatchCount(d.matches?.length ?? 0);
        setSubmissionCount(d.submissionCount ?? 0);
        setErrors(d.validationErrors ?? []);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const patch = async (body: Partial<Config>) => {
    await fetch("/api/admin/bracket", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  const validate = async () => {
    const res = await fetch("/api/admin/bracket/validate", { method: "POST" });
    const data = await res.json();
    setErrors(data.errors ?? []);
    alert(data.valid ? "جدول معتبر است" : "خطاهای اعتبارسنجی وجود دارد");
  };

  const publish = async () => {
    const res = await fetch("/api/admin/bracket/publish", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "انتشار ناموفق");
      setErrors(data.errors ?? []);
      return;
    }
    alert("جدول حذفی منتشر شد");
    load();
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="مدیریت جدول حذفی"
        description="تنظیم، اعتبارسنجی و انتشار جدول knockout"
        actions={
          <div className="flex gap-2">
            <AdminButton variant="outline" size="sm" onClick={validate}>
              <CheckCircle2 className="size-3.5" />
              اعتبارسنجی
            </AdminButton>
            <AdminButton size="sm" onClick={publish}>
              <Upload className="size-3.5" />
              انتشار جدول
            </AdminButton>
          </div>
        }
      />

      <AdminSection title="آمار">
        <div className="grid grid-cols-3 gap-3 lg:gap-4">
          <AdminMetricCard label="مسابقات" value={matchCount} icon={GitBranch} accent="primary" />
          <AdminMetricCard label="ثبت نهایی" value={submissionCount} accent="success" />
          <AdminMetricCard
            label="خطاها"
            value={errors.length}
            icon={AlertCircle}
            accent={errors.length > 0 ? "danger" : "success"}
          />
        </div>
      </AdminSection>

      {config && (
        <AdminCard className="mb-6">
          <AdminCardHeader title="تنظیمات" description="وضعیت دسترسی عمومی به جدول حذفی" />
          <AdminCardBody className="space-y-3">
            <AdminToggle
              label="فعال"
              description="جدول حذفی در سیستم فعال باشد"
              checked={config.enabled}
              onChange={(v) => patch({ enabled: v })}
            />
            <AdminToggle
              label="منتشر شده"
              description="کاربران بتوانند جدول را ببینند"
              checked={config.published}
              onChange={(v) => patch({ published: v })}
            />
            <AdminToggle
              label="ثبت باز"
              description="امکان ثبت پیش‌بینی جدول"
              checked={config.submissionOpen}
              onChange={(v) => patch({ submissionOpen: v })}
            />
          </AdminCardBody>
        </AdminCard>
      )}

      {errors.length > 0 && (
        <AdminCard className="border-[var(--admin-danger)]/30">
          <AdminCardHeader title="خطاهای اعتبارسنجی" />
          <AdminCardBody className="space-y-2">
            {errors.map((e, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {e.message}
              </div>
            ))}
          </AdminCardBody>
        </AdminCard>
      )}

      <p className="mt-4 text-xs text-[var(--admin-text-subtle)]">
        مقداردهی اولیه: <code dir="ltr">npm run db:seed</code>
      </p>
    </AdminLayout>
  );
}
