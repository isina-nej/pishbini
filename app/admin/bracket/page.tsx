"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

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

  if (loading) return <AdminLayout><p>بارگذاری...</p></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold">مدیریت جدول حذفی</h1>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs text-white/50">مسابقات</p>
          <p className="text-2xl font-bold text-primary">{matchCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-white/50">ثبت نهایی</p>
          <p className="text-2xl font-bold text-primary">{submissionCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-white/50">خطاهای اعتبارسنجی</p>
          <p className="text-2xl font-bold text-primary">{errors.length}</p>
        </div>
      </div>

      {config && (
        <div className="glass-card mb-6 space-y-3 p-4">
          <label className="flex items-center justify-between">
            <span>فعال</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>منتشر شده</span>
            <input
              type="checkbox"
              checked={config.published}
              onChange={(e) => patch({ published: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>ثبت باز</span>
            <input
              type="checkbox"
              checked={config.submissionOpen}
              onChange={(e) => patch({ submissionOpen: e.target.checked })}
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={validate}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm"
        >
          اعتبارسنجی
        </button>
        <button
          type="button"
          onClick={publish}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-[#10111f]"
        >
          انتشار جدول
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mt-6 space-y-2">
          <h2 className="font-bold text-danger">خطاها</h2>
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-white/70">
              {e.message}
            </p>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-white/50">
        برای مقداردهی اولیه: npm run db:seed
      </p>
    </AdminLayout>
  );
}
