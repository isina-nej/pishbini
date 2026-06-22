"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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

export function SubmitOtpModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const reset = useCallback(() => {
    setStep("info");
    setCode("");
    setError(null);
    setCountdown(0);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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
    if (code.length !== 4) {
      setError("کد تأیید باید ۴ رقم باشد.");
      return;
    }

    setStep("loading");
    const predictions = getStoredPredictions();
    const referralCode = getStoredReferralCode();

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          code,
          predictions,
          referralCode,
        }),
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

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="glass-card w-full max-w-[430px] overflow-hidden p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {step === "otp" ? "کد تأیید" : "ثبت پیش‌بینی"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {step === "info" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-white/60">نام</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="نام"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/60">نام خانوادگی</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="نام خانوادگی"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/60">شماره موبایل</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  dir="ltr"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white outline-none focus:border-primary"
                  placeholder="09123456789"
                />
              </div>
              <button
                type="button"
                onClick={sendOtp}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 font-bold text-[#10111f]"
              >
                دریافت کد تأیید
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-3">
              <p className="text-center text-sm text-white/60">
                کد ۴ رقمی به {phone} ارسال شد
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                type="tel"
                inputMode="numeric"
                dir="ltr"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-primary"
                placeholder="----"
                maxLength={4}
              />
              <button
                type="button"
                onClick={submitPredictions}
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 font-bold text-[#10111f]"
              >
                تأیید و ثبت پیش‌بینی
              </button>
              <button
                type="button"
                onClick={resendOtp}
                disabled={countdown > 0}
                className={cn(
                  "w-full py-2 text-sm",
                  countdown > 0 ? "text-white/30" : "text-primary hover:underline"
                )}
              >
                {countdown > 0
                  ? `ارسال مجدد (${countdown.toLocaleString("fa-IR")} ثانیه)`
                  : "ارسال مجدد کد"}
              </button>
            </div>
          )}

          {step === "loading" && (
            <div className="py-8 text-center text-white/70">لطفاً صبر کنید...</div>
          )}

          {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
