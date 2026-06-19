"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SubmitForm, type SubmitFormData } from "@/components/public/SubmitForm";
import {
  clearStoredPredictions,
  getStoredPredictions,
  getStoredReferralCode,
} from "@/lib/predictions-storage";

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const predictions = getStoredPredictions();
    if (predictions.length === 0) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  const handleSubmit = async (data: SubmitFormData) => {
    setLoading(true);
    setError(null);
    const predictions = getStoredPredictions();
    const referralCode = getStoredReferralCode();

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          predictions,
          referralCode,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "خطا در ثبت");
        return;
      }
      clearStoredPredictions();
      sessionStorage.setItem(
        "wc_success",
        JSON.stringify(result.user)
      );
      router.push("/success");
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="pb-10 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 px-4 text-center"
      >
        <h1 className="text-xl font-bold">ثبت پیش‌بینی</h1>
        <p className="mt-1 text-sm text-white/65">اطلاعات خود را وارد کنید</p>
      </motion.div>
      <SubmitForm onSubmit={handleSubmit} loading={loading} error={error} />
    </div>
  );
}
