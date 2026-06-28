"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeReferralCode } from "@/lib/referral";
import { getStoredReferralCode, setStoredReferralCode } from "@/lib/predictions-storage";

type Props = {
  value: string;
  onChange: (code: string) => void;
  inputClassName: string;
  skipStoredPrefill?: boolean;
  label?: string;
  inputId?: string;
};

type ValidateResponse = {
  valid: boolean;
  referralCode?: string;
  referrerFirstName?: string;
  referrerLastName?: string;
};

async function validateReferralCode(code: string): Promise<ValidateResponse> {
  const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(code)}`);
  return res.json();
}

export function ReferralCodeField({
  value,
  onChange,
  inputClassName,
  skipStoredPrefill = false,
  label = "کد معرف (اختیاری)",
  inputId = "referral-code",
}: Props) {
  const [locked, setLocked] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (skipStoredPrefill) return;
    if (initialized.current) return;
    initialized.current = true;

    const stored = getStoredReferralCode();
    if (!stored) return;

    setChecking(true);
    validateReferralCode(stored)
      .then((data) => {
        if (data.valid && data.referralCode) {
          onChange(data.referralCode);
          setStoredReferralCode(data.referralCode);
          setLocked(true);
          setReferrerName(
            [data.referrerFirstName, data.referrerLastName].filter(Boolean).join(" ")
          );
        }
      })
      .finally(() => setChecking(false));
  }, [onChange, skipStoredPrefill]);

  useEffect(() => {
    if (locked) return;

    if (!value.trim()) {
      setValidationError(null);
      setReferrerName(null);
      onChange("");
      return;
    }

    const normalized = normalizeReferralCode(value);
    if (!normalized) {
      setValidationError(null);
      setReferrerName(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setChecking(true);
      validateReferralCode(normalized)
        .then((data) => {
          if (!data.valid || !data.referralCode) {
            setValidationError("کد معرف معتبر نیست");
            setReferrerName(null);
            onChange("");
            return;
          }
          setValidationError(null);
          setReferrerName(
            [data.referrerFirstName, data.referrerLastName].filter(Boolean).join(" ")
          );
          setStoredReferralCode(data.referralCode);
          onChange(data.referralCode);
        })
        .finally(() => setChecking(false));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [value, locked, onChange]);

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-xs text-white/60">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          value={value}
          onChange={(e) => {
            if (locked) return;
            onChange(e.target.value.toUpperCase());
          }}
          readOnly={locked}
          disabled={locked}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            inputClassName,
            "text-left uppercase tracking-wider",
            locked && "cursor-not-allowed opacity-90"
          )}
          placeholder="ABC1234"
        />
        {checking && (
          <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
        )}
      </div>
      {locked && referrerName && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
          <UserPlus className="size-3.5 shrink-0" />
          دعوت‌شده توسط {referrerName}
        </p>
      )}
      {!locked && referrerName && !validationError && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="size-3.5 shrink-0" />
          معرف: {referrerName}
        </p>
      )}
      {validationError && (
        <p className="mt-2 text-xs text-white/45">{validationError}</p>
      )}
    </div>
  );
}
