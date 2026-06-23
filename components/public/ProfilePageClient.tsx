"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy,
  GitBranch,
  LogOut,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type { UserProfile } from "@/lib/profile-service";
import { ErrorState } from "@/components/public/ErrorState";
import { LoadingState } from "@/components/public/LoadingState";
import { cn } from "@/lib/utils";

export function ProfilePageClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.status === 401) {
        router.replace("/login?from=/profile");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setProfile(data.profile);
    } catch {
      setError("خطا در دریافت اطلاعات حساب");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  const copyReferral = async () => {
    if (!profile?.referralLink) return;
    try {
      await navigator.clipboard.writeText(profile.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) return <LoadingState />;
  if (error || !profile) return <ErrorState message={error ?? "خطا در بارگذاری"} />;

  return (
    <div className="pb-28 pt-4">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 px-4 text-center"
      >
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/25 ring-1 ring-white/10">
          <User className="size-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">
          {profile.firstName} {profile.lastName}
        </h1>
        <p dir="ltr" className="mt-1 text-sm text-white/50">
          {profile.maskedPhone}
        </p>
        <p className="mt-1 text-[11px] text-white/35">
          عضو از {profile.memberSinceLabel}
        </p>
      </motion.header>

      <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
        <StatCard
          icon={Trophy}
          label="امتیاز"
          value={profile.computedScore}
          accent="text-amber-400"
        />
        <StatCard
          icon={Target}
          label="رتبه"
          value={profile.rank ?? "—"}
          accent="text-primary"
        />
        <StatCard icon={Target} label="درست" value={profile.correctCount} accent="text-success" />
        <StatCard icon={Target} label="نادرست" value={profile.wrongCount} accent="text-white/70" />
        <StatCard
          icon={Users}
          label="دعوت موفق"
          value={profile.referralCount}
          accent="text-secondary"
          className="col-span-2"
        />
      </div>

      <div className="glass-card mx-4 mb-4 p-4">
        <p className="mb-2 text-xs text-white/50">لینک دعوت شما</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <p dir="ltr" className="min-w-0 flex-1 truncate text-left text-xs text-white/80">
            {profile.referralLink}
          </p>
          <button
            type="button"
            onClick={copyReferral}
            className="shrink-0 rounded-lg bg-primary/15 p-2 text-primary"
            aria-label="کپی لینک"
          >
            <Copy className="size-4" />
          </button>
        </div>
        {copied && <p className="mt-2 text-center text-xs text-success">کپی شد</p>}
      </div>

      {profile.bracketSubmitted && (
        <div className="glass-card mx-4 mb-4 flex items-center gap-3 p-4">
          <GitBranch className="size-5 shrink-0 text-secondary" />
          <div>
            <p className="text-sm font-medium">جدول حذفی ثبت شده</p>
            <p className="text-xs text-white/50">
              قهرمان پیش‌بینی‌شده: {profile.championTeamName ?? "—"}
            </p>
          </div>
        </div>
      )}

      <div className="mx-4 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">تاریخچه پیش‌بینی‌ها</h2>
        <span className="text-xs text-white/40">
          {profile.predictionsCount.toLocaleString("fa-IR")} مورد
        </span>
      </div>

      {profile.predictions.length === 0 ? (
        <p className="mx-4 rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-white/45">
          هنوز پیش‌بینی ثبت نکرده‌اید.
          <Link href="/" className="mt-2 block text-primary">
            رفتن به پیش‌بینی
          </Link>
        </p>
      ) : (
        <div className="mx-4 space-y-2">
          {profile.predictions.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{p.matchLabel}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                    p.resultLabel.startsWith("درست")
                      ? "bg-success/15 text-success"
                      : p.resultLabel.startsWith("نادرست")
                        ? "bg-white/10 text-white/50"
                        : "bg-warning/15 text-warning"
                  )}
                >
                  {p.resultLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-primary">{p.predictionLabel}</p>
              <p className="mt-1 text-[10px] text-white/35">
                بازی: {p.startTimeLabel} · ثبت: {p.createdAtLabel}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mx-4 mt-6">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-white/60 transition-colors hover:border-danger/30 hover:text-danger"
        >
          <LogOut className="size-4" />
          خروج از حساب
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  className,
}: {
  icon: typeof Trophy;
  label: string;
  value: number | string;
  accent: string;
  className?: string;
}) {
  const display =
    typeof value === "number" ? value.toLocaleString("fa-IR") : value;

  return (
    <div className={cn("rounded-xl border border-white/8 bg-white/[0.03] p-3", className)}>
      <p className={cn("flex items-center gap-1 text-lg font-bold", accent)}>
        <Icon className="size-4 opacity-80" />
        {display}
      </p>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  );
}
