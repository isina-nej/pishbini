"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PredictionChoice } from "@/generated/prisma";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminSelect, AdminLabel, AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/AdminCard";
import { getMatchOutcomeOptions } from "@/lib/prediction-labels";
import { X } from "lucide-react";

type Props = {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  onClose: () => void;
  onSettled: () => void;
};

export function AdminSettlementModal({
  matchId,
  homeTeamName,
  awayTeamName,
  onClose,
  onSettled,
}: Props) {
  const [result, setResult] = useState<PredictionChoice>(PredictionChoice.HOME_WIN);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const outcomeOptions = useMemo(
    () => getMatchOutcomeOptions(homeTeamName, awayTeamName),
    [homeTeamName, awayTeamName]
  );

  const parseScore = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isInteger(n) && n >= 0 ? n : null;
  };

  const handleSettle = async () => {
    if (!confirm("نتیجه ذخیره و امتیازها بلافاصله محاسبه می‌شوند. اعلان پوش ۱۰ دقیقه بعد ارسال می‌شود.")) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/results/${matchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correctPrediction: result,
        homeScore: parseScore(homeScore),
        awayScore: parseScore(awayScore),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSummary(data.summary);
      onSettled();
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <AdminCard className="w-full max-w-md admin-animate-in">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
          <h3 className="font-bold">ثبت نتیجه و تسویه</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-hover)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <AdminCardBody>
          <AdminLabel>نتیجه صحیح بازی *</AdminLabel>
          <AdminSelect
            value={result}
            onChange={(e) => setResult(e.target.value as PredictionChoice)}
            className="mb-4"
          >
            {outcomeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AdminSelect>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <AdminLabel>گل {homeTeamName}</AdminLabel>
              <AdminInput
                type="number"
                min={0}
                placeholder="—"
                dir="ltr"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
              />
            </div>
            <div>
              <AdminLabel>گل {awayTeamName}</AdminLabel>
              <AdminInput
                type="number"
                min={0}
                placeholder="—"
                dir="ltr"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
              />
            </div>
          </div>

          {summary && (
            <div className="mb-4 rounded-xl bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">
              تسویه شد: {summary.correctCount} درست، {summary.wrongCount} نادرست
            </div>
          )}

          <p className="mb-3 text-[11px] text-[var(--admin-text-muted)]">
            برای ویرایش بعدی به{" "}
            <Link href="/admin/results" className="text-[var(--admin-primary)] underline">
              صفحه ثبت نتایج
            </Link>{" "}
            بروید.
          </p>

          <div className="flex gap-2">
            <AdminButton onClick={handleSettle} disabled={loading} className="flex-1">
              {loading ? "..." : "تایید تسویه"}
            </AdminButton>
            <AdminButton variant="outline" onClick={onClose} className="flex-1">
              بستن
            </AdminButton>
          </div>
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
