"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, LogIn, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

type Step = "phone" | "otp" | "loading";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otpRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const redirectTo = searchParams.get("from") || "/profile";

  useEffect(() => {
    fetch("/api/me/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace(redirectTo);
          router.refresh();
        }
      })
      .catch(() => {});
  }, [router, redirectTo]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (step !== "otp") return;
    const t = window.setTimeout(() => otpRef.current?.focus(), 200);
    return () => window.clearTimeout(t);
  }, [step]);

  const sendOtp = async () => {
    setError(null);
    if (!phone.trim()) {
      setError("شماره موبایل الزامی است.");
      return;
    }

    setStep("loading");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ارسال کد");
        setStep("phone");
        return;
      }
      setStep("otp");
      setCountdown(120);
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep("phone");
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ارسال مجدد");
        return;
      }
      setCountdown(120);
    } catch {
      setError("خطا در ارتباط با سرور");
    }
  };

  const login = async () => {
    setError(null);
    if (code.length !== 4) {
      setError("کد تأیید باید ۴ رقم باشد.");
      return;
    }

    setStep("loading");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ورود");
        setStep("otp");
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep("otp");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mx-4 overflow-hidden p-5"
    >
      {step === "phone" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="login-phone" className="mb-1.5 block text-xs text-white/60">
              شماره موبایل
            </label>
            <input
              id="login-phone"
              data-tour="login-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className={cn(inputClassName, "text-left")}
              placeholder="09123456789"
            />
          </div>
          <button
            type="button"
            data-tour="login-send"
            onClick={sendOtp}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f]"
          >
            <Phone className="size-4" />
            دریافت کد تأیید
          </button>
          <p className="text-center text-xs leading-relaxed text-white/45">
            حساب کاربری با همان شماره‌ای ساخته می‌شود که قبلاً پیش‌بینی ثبت کرده‌اید.
          </p>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <p className="text-center text-sm text-white/60">
            کد به{" "}
            <span dir="ltr" className="font-medium text-white/80">
              {phone}
            </span>{" "}
            ارسال شد
          </p>
          <input
            ref={otpRef}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            className={cn(
              inputClassName,
              "py-4 text-center text-2xl tracking-[0.45em] tabular-nums"
            )}
            placeholder="••••"
            maxLength={4}
            aria-label="کد تأیید ۴ رقمی"
          />
          <button
            type="button"
            onClick={login}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f]"
          >
            <LogIn className="size-4" />
            ورود
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60"
            >
              تغییر شماره
            </button>
            <button
              type="button"
              onClick={resendOtp}
              disabled={countdown > 0}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm",
                countdown > 0 ? "text-white/30" : "text-primary"
              )}
            >
              {countdown > 0
                ? `ارسال مجدد (${countdown.toLocaleString("fa-IR")}s)`
                : "ارسال مجدد"}
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="flex flex-col items-center gap-3 py-10 text-white/70">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">لطفاً صبر کنید...</p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-center text-sm text-danger"
        >
          {error}
        </p>
      )}

      <p className="mt-5 text-center text-xs text-white/40">
        هنوز ثبت‌نام نکرده‌اید؟{" "}
        <Link href="/" className="text-primary hover:underline">
          پیش‌بینی کنید
        </Link>
      </p>
    </motion.div>
  );
}
