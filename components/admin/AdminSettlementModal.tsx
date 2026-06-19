"use client";

import { useState } from "react";
import { PredictionChoice } from "@/generated/prisma";

type Props = {
  matchId: string;
  onClose: () => void;
  onSettled: () => void;
};

export function AdminSettlementModal({ matchId, onClose, onSettled }: Props) {
  const [result, setResult] = useState<PredictionChoice>(PredictionChoice.HOME_WIN);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const handleSettle = async () => {
    if (!confirm("آیا از ثبت نتیجه و تسویه اطمینان دارید؟")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/matches/${matchId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctPrediction: result }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-card w-full max-w-md p-6">
        <h3 className="mb-4 text-lg font-bold">ثبت نتیجه بازی</h3>
        <select
          value={result}
          onChange={(e) => setResult(e.target.value as PredictionChoice)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        >
          <option value={PredictionChoice.HOME_WIN}>برد میزبان</option>
          <option value={PredictionChoice.DRAW}>مساوی</option>
          <option value={PredictionChoice.AWAY_WIN}>برد میهمان</option>
        </select>

        {summary && (
          <div className="mb-4 text-sm text-success">
            تسویه شد: {summary.correctCount} درست، {summary.wrongCount} نادرست
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSettle}
            disabled={loading}
            className="flex-1 rounded-lg bg-primary py-2 font-bold text-[#10111f]"
          >
            {loading ? "..." : "تایید تسویه"}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2">
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
