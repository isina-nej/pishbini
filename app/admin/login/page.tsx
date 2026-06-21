"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trophy } from "lucide-react";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("رمز عبور اشتباه است");
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-bg flex min-h-dvh">
      <div className="hidden w-1/2 flex-col justify-between border-e border-[var(--admin-border)] p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)]">
            <Trophy className="size-5 text-[var(--admin-primary)]" />
          </div>
          <div>
            <p className="font-bold">پیشرو سرمایه</p>
            <p className="text-xs text-[var(--admin-text-muted)]">کمپین پیش‌بینی جام جهانی</p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            پنل مدیریت
            <span className="block text-[var(--admin-primary)]">حرفه‌ای و امن</span>
          </h1>
          <p className="text-sm leading-relaxed text-[var(--admin-text-muted)]">
            مدیریت بازی‌ها، شرکت‌کنندگان، قوانین امتیاز، جدول حذفی و تسویه نتایج — همه در یک
            داشبورد یکپارچه.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["تیم‌ها", "بازی‌ها", "امتیازات", "جدول حذفی"].map((item) => (
              <span
                key={item}
                className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs text-[var(--admin-text-muted)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--admin-text-subtle)]">
          دسترسی محدود به مدیران سیستم
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="admin-card w-full max-w-sm p-8 admin-animate-in"
        >
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-right">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] lg:hidden">
              <Shield className="size-6 text-[var(--admin-primary)]" />
            </div>
            <h2 className="text-xl font-bold">ورود مدیر</h2>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
              رمز عبور پنل را وارد کنید
            </p>
          </div>

          <div className="mb-5">
            <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
              رمز عبور
            </label>
            <AdminInput
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2 text-center text-sm text-[var(--admin-danger)]">
              {error}
            </p>
          )}

          <AdminButton type="submit" disabled={loading} className="w-full">
            {loading ? "در حال ورود..." : "ورود به پنل"}
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
