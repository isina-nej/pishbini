"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitForm, type SubmitFormData } from "@/components/public/SubmitForm";
import { getStoredReferralCode } from "@/lib/predictions-storage";
import { clearDraft } from "@/lib/bracket/storage";
import type { BracketPicks } from "@/lib/bracket/types";

export default function BracketSubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<BracketPicks>({});
  const [championTeamId, setChampionTeamId] = useState("");

  useEffect(() => {
    const rawPicks = sessionStorage.getItem("wc_bracket_picks");
    const champion = sessionStorage.getItem("wc_bracket_champion");
    if (!rawPicks || !champion) {
      router.replace("/bracket");
      return;
    }
    try {
      setPicks(JSON.parse(rawPicks));
      setChampionTeamId(champion);
    } catch {
      router.replace("/bracket");
    }
  }, [router]);

  const handleSubmit = async (data: SubmitFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bracket/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          picks,
          championTeamId,
          referralCode: getStoredReferralCode(),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "خطا در ثبت");
        return;
      }
      clearDraft();
      sessionStorage.removeItem("wc_bracket_picks");
      sessionStorage.removeItem("wc_bracket_champion");
      sessionStorage.setItem("wc_bracket_success", JSON.stringify(result.data));
      router.push("/bracket/success");
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!championTeamId) return null;

  return (
    <div className="bracket-root px-4 py-8">
      <h1 className="mb-2 text-center text-xl font-bold">ثبت نهایی پیش‌بینی قهرمان</h1>
      <p className="mb-8 text-center text-sm text-[var(--bracket-text-muted)]">
        اطلاعات خود را وارد کنید
      </p>
      <SubmitForm onSubmit={handleSubmit} loading={loading} error={error} />
    </div>
  );
}
