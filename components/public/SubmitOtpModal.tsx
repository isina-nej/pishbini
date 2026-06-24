"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { AUTH_INPUT_CLASS } from "@/components/public/PhoneAuthFlow";
import { cn } from "@/lib/utils";
import {
  clearStoredPredictions,
  getStoredPredictions,
  getStoredReferralCode,
} from "@/lib/predictions-storage";

type Step = "info" | "otp" | "loading";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: {
    firstName: string;
    referralCode: string;
    referralLink: string;
    computedScore: number;
    newPredictionsCount: number;
  }) => void;
};

const inputClassName = AUTH_INPUT_CLASS;

export function SubmitOtpModal({ open, onClose, onSuccess }: Props) {
  const titleId = useId();
  const otpRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  const reset = useCallback(() => {
    setStep("info");
    setCode("");
    setError(null);
    setCountdown(0);
    setLoggedIn(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/me/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.loggedIn) return;
        setLoggedIn(true);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        if (data.phone) setPhone(data.phone);
        setStep("otp");
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!open || step !== "otp") return;
    const t = window.setTimeout(() => otpRef.current?.focus(), 280);
    return () => window.clearTimeout(t);
  }, [open, step]);

  const sendOtp = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("نام، نام خانوادگی و شماره موبایل الزامی است.");
      return;
    }

    setStep("loading");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ارسال کد");
        setStep("info");
        return;
      }
      setStep("otp");
      setCountdown(120);
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep("info");
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName, lastName }),
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

  const submitPredictions = async () => {
    setError(null);
    if (!loggedIn && code.length !== 4) {
      setError("کد تأیید باید ۴ رقم باشد.");
      return;
    }

    setStep("loading");
    const predictions = getStoredPredictions();
    const referralCode = getStoredReferralCode();

    try {
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        phone,
        predictions,
        referralCode,
      };
      if (!loggedIn) payload.code = code;

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "خطا در ثبت");
        setStep("otp");
        return;
      }
      clearStoredPredictions();
      onSuccess({
        firstName: result.user.firstName,
        referralCode: result.user.referralCode,
        referralLink: result.user.referralLink,
        computedScore: result.user.computedScore,
        newPredictionsCount: result.user.newPredictionsCount,
      });
      onClose();
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep("otp");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="بستن"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className={cn(
              "relative z-10 flex w-full max-w-[430px] flex-col",
              "max-h-[min(92dvh,720px)]",
              "rounded-t-[1.75rem] border border-white/10 border-b-0 glass-panel",
              "shadow-[0_-12px_48px_rgba(0,0,0,0.55)]",
              "pb-[max(1rem,env(safe-area-inset-bottom))]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 shrink-0 rounded-t-[1.75rem] glass-surface px-5 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/25 sm:hidden"
                aria-hidden
              />

              <div className="flex items-start justify-between gap-3 pb-3">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="text-lg font-bold leading-snug">
                    {loggedIn ? "ثبت پیش‌بینی" : step === "otp" ? "کد تأیید" : "ثبت پیش‌بینی"}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {loggedIn
                      ? "پیش‌بینی‌های جدید با حساب شما ثبت می‌شود"
                      : step === "otp"
                        ? "کد ۴ رقمی پیامک‌شده را وارد کنید"
                        : "اطلاعات تماس برای تأیید و ثبت نهایی"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="بستن"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 [-webkit-overflow-scrolling:touch]">
              {step === "info" && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="otp-first-name" className="mb-1.5 block text-xs text-white/60">
                      نام
                    </label>
                    <input
                      id="otp-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      enterKeyHint="next"
                      className={inputClassName}
                      placeholder="نام"
                    />
                  </div>
                  <div>
                    <label htmlFor="otp-last-name" className="mb-1.5 block text-xs text-white/60">
                      نام خانوادگی
                    </label>
                    <input
                      id="otp-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      enterKeyHint="next"
                      className={inputClassName}
                      placeholder="نام خانوادگی"
                    />
                  </div>
                  <div>
                    <label htmlFor="otp-phone" className="mb-1.5 block text-xs text-white/60">
                      شماره موبایل
                    </label>
                    <input
                      id="otp-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="done"
                      dir="ltr"
                      className={cn(inputClassName, "text-left")}
                      placeholder="09123456789"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="mt-1 w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f] active:scale-[0.99]"
                  >
                    دریافت کد تأیید
                  </button>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-4">
                  {loggedIn ? (
                    <>
                      <p className="text-center text-sm text-white/60">
                        {firstName} {lastName}
                        <br />
                        <span dir="ltr" className="text-white/80">
                          {phone}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={submitPredictions}
                        className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f] active:scale-[0.99]"
                      >
                        ثبت پیش‌بینی
                      </button>
                    </>
                  ) : (
                    <>
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
                        enterKeyHint="done"
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
                        onClick={submitPredictions}
                        className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f] active:scale-[0.99]"
                      >
                        تأیید و ثبت پیش‌بینی
                      </button>
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={countdown > 0}
                        className={cn(
                          "w-full py-2.5 text-sm",
                          countdown > 0 ? "text-white/30" : "text-primary hover:underline"
                        )}
                      >
                        {countdown > 0
                          ? `ارسال مجدد (${countdown.toLocaleString("fa-IR")} ثانیه)`
                          : "ارسال مجدد کد"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {step === "loading" && (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-white/70">
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
