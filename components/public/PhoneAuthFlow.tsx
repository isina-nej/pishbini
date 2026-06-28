"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LogIn, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReferralCodeField } from "@/components/public/ReferralCodeField";
import { notifySessionUpdated } from "@/lib/session-events";

export const AUTH_INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

type Step = "phone" | "names" | "otp" | "loading";

type Props = {
  variant?: "inline" | "sheet";
  onSuccess: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  title?: string;
  subtitle?: string;
};

export function PhoneAuthFlow({
  variant = "inline",
  onSuccess,
  onCancel,
  showCancel = false,
  title = "ورود به حساب",
  subtitle = "شماره موبایل خود را وارد کنید",
}: Props) {
  const otpRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

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

  const sendOtp = async (isRegisteredOverride?: boolean) => {
    setError(null);
    setStep("loading");
    const isRegisteredUser = isRegisteredOverride ?? registered;
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          ...(isRegisteredUser === false
            ? { firstName: firstName.trim(), lastName: lastName.trim() }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ارسال کد");
        setStep(isRegisteredUser === false ? "names" : "phone");
        return;
      }
      setStep("otp");
      setCountdown(120);
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep(isRegisteredUser === false ? "names" : "phone");
    }
  };

  const checkPhone = async () => {
    setError(null);
    if (!phone.trim()) {
      setError("شماره موبایل الزامی است.");
      return;
    }

    setStep("loading");
    try {
      const res = await fetch("/api/auth/phone-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در بررسی شماره");
        setStep("phone");
        return;
      }

      setRegistered(data.registered);
      if (data.registered) {
        await sendOtp(true);
      } else {
        setStep("names");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep("phone");
    }
  };

  const continueFromNames = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("نام و نام خانوادگی الزامی است.");
      return;
    }
    setRegistered(false);
    await sendOtp(false);
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    await sendOtp();
  };

  const verify = async () => {
    setError(null);
    if (code.length !== 4) {
      setError("کد تأیید باید ۴ رقم باشد.");
      return;
    }

    setStep("loading");
    try {
      const endpoint = registered ? "/api/auth/login" : "/api/auth/register";
      const body = registered
        ? { phone, code }
        : {
            phone,
            code,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            referralCode: referralCode || null,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در تأیید");
        setStep("otp");
        return;
      }
      onSuccess();
      notifySessionUpdated();
    } catch {
      setError("خطا در ارتباط با سرور");
      setStep("otp");
    }
  };

  const resetToPhone = () => {
    setStep("phone");
    setCode("");
    setReferralCode("");
    setRegistered(null);
    setError(null);
  };

  const wrapperClass =
    variant === "sheet"
      ? "space-y-4"
      : "glass-panel mx-4 overflow-hidden p-5";

  return (
    <div className={wrapperClass}>
      {(title || subtitle) && step !== "loading" && (
        <div className={cn("mb-4 text-center", variant === "sheet" && "px-1")}>
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {subtitle && step === "phone" && (
            <p className="mt-1 text-sm text-white/55">{subtitle}</p>
          )}
        </div>
      )}

      {showCancel && onCancel && step !== "loading" && (
        <button
          type="button"
          onClick={onCancel}
          className="mb-3 w-full rounded-xl border border-white/10 py-2 text-sm text-white/55 transition-colors hover:bg-white/5"
        >
          انصراف و بازگشت به پیش‌بینی
        </button>
      )}

      {step === "phone" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="auth-phone" className="mb-1.5 block text-xs text-white/60">
              شماره موبایل
            </label>
            <input
              id="auth-phone"
              data-tour="login-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className={cn(AUTH_INPUT_CLASS, "text-left")}
              placeholder="09123456789"
            />
          </div>
          <button
            type="button"
            data-tour="login-send"
            onClick={checkPhone}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f]"
          >
            <Phone className="size-4" />
            ادامه
          </button>
        </div>
      )}

      {step === "names" && (
        <div className="space-y-4">
          <p className="text-center text-sm text-white/60">
            شماره جدید است. نام خود را وارد کنید.
          </p>
          <div>
            <label htmlFor="auth-first" className="mb-1.5 block text-xs text-white/60">
              نام
            </label>
            <input
              id="auth-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={AUTH_INPUT_CLASS}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="auth-last" className="mb-1.5 block text-xs text-white/60">
              نام خانوادگی
            </label>
            <input
              id="auth-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={AUTH_INPUT_CLASS}
              autoComplete="family-name"
            />
          </div>
          <ReferralCodeField
            value={referralCode}
            onChange={setReferralCode}
            inputClassName={AUTH_INPUT_CLASS}
          />
          <button
            type="button"
            onClick={continueFromNames}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f]"
          >
            <User className="size-4" />
            دریافت کد تأیید
          </button>
          <button
            type="button"
            onClick={resetToPhone}
            className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/60"
          >
            تغییر شماره
          </button>
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
              AUTH_INPUT_CLASS,
              "py-4 text-center text-2xl tracking-[0.45em] tabular-nums"
            )}
            placeholder="••••"
            maxLength={4}
            aria-label="کد تأیید ۴ رقمی"
          />
          <button
            type="button"
            onClick={verify}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-3.5 text-base font-bold text-[#10111f]"
          >
            <LogIn className="size-4" />
            {registered ? "ورود" : "تأیید و ساخت حساب"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetToPhone}
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
    </div>
  );
}
