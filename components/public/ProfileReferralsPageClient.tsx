"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { ErrorState } from "@/components/public/ErrorState";
import { LoadingState } from "@/components/public/LoadingState";
import { PhoneAuthFlow } from "@/components/public/PhoneAuthFlow";

type ReferralItem = {
  firstName: string;
  lastName: string;
  registeredAtLabel: string;
};

export function ProfileReferralsPageClient() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/referrals");
      const data = await res.json();
      if (res.status === 401) {
        setLoggedIn(false);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setReferrals(data.referrals ?? []);
      setLoggedIn(true);
    } catch {
      setError("خطا در دریافت لیست دعوت‌شدگان");
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
        await loadReferrals();
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
  }, [loadReferrals]);

  if (!authChecked || (loggedIn && loading)) {
    return <LoadingState />;
  }

  if (!loggedIn) {
    return (
      <div className="pb-32 pt-6">
        <PhoneAuthFlow
          title="دعوت‌شدگان"
          subtitle="برای مشاهده لیست دعوت‌شدگان وارد شوید"
          onSuccess={() => {
            setLoggedIn(true);
            loadReferrals();
          }}
        />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="pb-32 pt-4">
      <div className="mb-5 flex items-center gap-3 px-4">
        <Link
          href="/profile"
          className="rounded-xl border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5"
          aria-label="بازگشت به پروفایل"
        >
          <ArrowRight className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">دعوت‌شدگان من</h1>
          <p className="text-xs text-white/45">
            {referrals.length.toLocaleString("fa-IR")} نفر با لینک شما ثبت‌نام کرده‌اند
          </p>
        </div>
      </div>

      {referrals.length === 0 ? (
        <p className="mx-4 rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-white/45">
          هنوز کسی با لینک دعوت شما ثبت‌نام نکرده است.
        </p>
      ) : (
        <div className="mx-4 space-y-2">
          {referrals.map((item, i) => (
            <motion.div
              key={`${item.firstName}-${item.lastName}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="glass-surface flex items-center gap-3 rounded-2xl p-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
                <Users className="size-4 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {item.firstName} {item.lastName}
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">
                  تاریخ ثبت‌نام: {item.registeredAtLabel}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
