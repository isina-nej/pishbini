"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  GitBranch,
  LogOut,
  Target,
  Trophy,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import type { UserProfile, ProfilePrediction } from "@/lib/profile-service";
import { ErrorState } from "@/components/public/ErrorState";
import { LoadingState } from "@/components/public/LoadingState";
import { EditPredictionSheet } from "@/components/public/EditPredictionSheet";
import { PhoneAuthFlow, AUTH_INPUT_CLASS } from "@/components/public/PhoneAuthFlow";
import { ReferralCodeField } from "@/components/public/ReferralCodeField";
import { PushNotificationSettings } from "@/components/public/PushNotificationSettings";
import { TourPageReady } from "@/components/public/TourPageReady";
import { restartTour } from "@/lib/product-tour";
import { cn } from "@/lib/utils";

export function ProfilePageClient() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [editing, setEditing] = useState<ProfilePrediction | null>(null);
  const [claimReferralCode, setClaimReferralCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.status === 401) {
        setLoggedIn(false);
        setProfile(null);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setProfile(data.profile);
      setLoggedIn(true);
    } catch {
      setError("خطا در دریافت اطلاعات حساب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/session", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (!data.loggedIn) {
          setLoggedIn(false);
          setLoading(false);
          setAuthChecked(true);
          return;
        }
        setLoggedIn(true);
        setAuthChecked(true);
        await loadProfile();
      } catch {
        if (!cancelled) {
          setAuthChecked(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const handleAuthSuccess = () => {
    setLoggedIn(true);
    loadProfile();
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
    setLoggedIn(false);
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

  const copyReferralCode = async () => {
    if (!profile?.referralCode) return;
    try {
      await navigator.clipboard.writeText(profile.referralCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const claimReferrer = async () => {
    if (!claimReferralCode) {
      setClaimError("کد دعوت‌کننده معتبر وارد کنید.");
      return;
    }
    setClaimLoading(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/me/claim-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: claimReferralCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error ?? "خطا در ثبت دعوت‌کننده");
        return;
      }
      setClaimReferralCode("");
      await loadProfile();
    } catch {
      setClaimError("خطا در ارتباط با سرور");
    } finally {
      setClaimLoading(false);
    }
  };

  if (!authChecked || (loggedIn && loading)) {
    return (
      <>
        <TourPageReady ready={false} />
        <LoadingState />
      </>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <TourPageReady ready={false} />
        <div className="pb-32 pt-6">
          <PhoneAuthFlow
            title="حساب کاربری"
            subtitle="برای مشاهده پروفایل وارد شوید یا ثبت‌نام کنید"
            onSuccess={handleAuthSuccess}
            onCancel={() => router.replace("/")}
            showCancel
          />
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <TourPageReady ready={false} />
        <ErrorState message={error ?? "خطا در بارگذاری"} />
      </>
    );
  }

  const editablePrediction = profile.predictions.find((p) => p.canEdit);

  return (
    <>
      <TourPageReady ready />
      <div className="pb-32 pt-4">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 px-4 text-center"
        data-tour="profile-header"
      >
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl glass-surface bg-gradient-to-br from-primary/25 to-secondary/25">
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
        {profile.referrer && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-white/35">
            <CheckCircle2 className="size-3 shrink-0 text-primary/70" />
            معرف: {profile.referrer.firstName} {profile.referrer.lastName}
          </p>
        )}
      </motion.header>

      <div className="mx-4 mb-4 grid grid-cols-2 gap-2" data-tour="profile-stats">
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

      <PushNotificationSettings
        pushOptIn={profile.pushOptIn}
        onPushOptInChange={(enabled) =>
          setProfile((prev) => (prev ? { ...prev, pushOptIn: enabled } : prev))
        }
      />

      {profile.canClaimReferrer && (
        <div className="glass-card mx-4 mb-4 p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            <p className="text-sm font-medium">ثبت دعوت‌کننده</p>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-white/50">
            اگر با لینک دعوت وارد نشده‌اید، می‌توانید یک‌بار کد دعوت‌کننده را ثبت کنید.
          </p>
          {profile.selfReferrerClaimPoints > 0 && (
            <p className="mb-3 text-xs text-primary">
              با ثبت دعوت‌کننده،{" "}
              {profile.selfReferrerClaimPoints.toLocaleString("fa-IR")} امتیاز دریافت می‌کنید.
            </p>
          )}
          <ReferralCodeField
            value={claimReferralCode}
            onChange={setClaimReferralCode}
            inputClassName={AUTH_INPUT_CLASS}
            skipStoredPrefill
            label="کد دعوت‌کننده"
            inputId="claim-referrer-code"
          />
          {claimError && (
            <p role="alert" className="mt-3 text-xs text-danger">
              {claimError}
            </p>
          )}
          <button
            type="button"
            onClick={claimReferrer}
            disabled={claimLoading || !claimReferralCode}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-3 text-sm font-bold text-[#10111f] disabled:opacity-50"
          >
            {claimLoading ? "در حال ثبت..." : "ثبت دعوت‌کننده"}
          </button>
        </div>
      )}

      <div className="glass-card mx-4 mb-4 p-4" data-tour="profile-referral">
        <p className="mb-2 text-xs text-white/50">لینک دعوت شما</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <p dir="ltr" className="min-w-0 flex-1 truncate text-left text-xs text-white/80">
            {profile.referralLink}
          </p>
          <button
            type="button"
            data-tour="profile-referral-copy"
            onClick={copyReferral}
            className="shrink-0 rounded-lg bg-primary/15 p-2 text-primary"
            aria-label="کپی لینک"
          >
            <Copy className="size-4" />
          </button>
        </div>
        {copied && <p className="mt-2 text-center text-xs text-success">لینک کپی شد</p>}

        <p className="mb-2 mt-4 text-xs text-white/50">کد دعوت شما</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <p dir="ltr" className="min-w-0 flex-1 text-left text-sm font-medium tracking-wider text-white/90">
            {profile.referralCode}
          </p>
          <button
            type="button"
            onClick={copyReferralCode}
            className="shrink-0 rounded-lg bg-primary/15 p-2 text-primary"
            aria-label="کپی کد"
          >
            <Copy className="size-4" />
          </button>
        </div>
        {codeCopied && <p className="mt-2 text-center text-xs text-success">کد کپی شد</p>}

        <Link
          href="/profile/referrals"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-secondary hover:underline"
        >
          <Users className="size-3.5" />
          دعوت‌شدگان من ({profile.referralCount.toLocaleString("fa-IR")})
        </Link>
      </div>

      {profile.bracketSubmitted && (
        <div className="glass-card mx-4 mb-4 flex items-center gap-3 p-4" data-tour="profile-bracket">
          <GitBranch className="size-5 shrink-0 text-secondary" />
          <div>
            <p className="text-sm font-medium">جدول حذفی ثبت شده</p>
            <p className="text-xs text-white/50">
              قهرمان پیش‌بینی‌شده: {profile.championTeamName ?? "—"}
            </p>
          </div>
        </div>
      )}

      <div className="mx-4 mb-3 flex items-center justify-between" data-tour="profile-history">
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
              className="glass-surface rounded-2xl p-3"
              data-tour={p.id === editablePrediction?.id ? "profile-edit" : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{p.matchLabel}</p>
                  {p.matchResultScore && (
                    <p className="mt-0.5 text-xs tabular-nums text-white/50">
                      نتیجه: {p.matchResultScore}
                    </p>
                  )}
                </div>
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
              {p.canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  ویرایش پیش‌بینی
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mx-4 mt-4">
        <button
          type="button"
          data-tour="profile-replay-tour"
          onClick={() => restartTour("profile")}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 text-sm font-medium text-primary"
        >
          مشاهده مجدد آموزش حساب
        </button>
      </div>

      <div className="mx-4 mt-2">
        <button
          type="button"
          data-tour="profile-logout"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-white/60 transition-colors hover:border-danger/30 hover:text-danger"
        >
          <LogOut className="size-4" />
          خروج از حساب
        </button>
      </div>

      <EditPredictionSheet
        prediction={editing}
        onClose={() => setEditing(null)}
        onSaved={loadProfile}
      />
    </div>
    </>
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
    <div className={cn("glass-surface rounded-2xl p-3", className)}>
      <p className={cn("flex items-center gap-1 text-lg font-bold", accent)}>
        <Icon className="size-4 opacity-80" />
        {display}
      </p>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  );
}
