"use client";

import { useState } from "react";
import { PredictionChoice } from "@/generated/prisma";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminSelect, AdminLabel } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/AdminCard";
import { X } from "lucide-react";

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
          <AdminLabel>نتیجه صحیح بازی</AdminLabel>
          <AdminSelect
            value={result}
            onChange={(e) => setResult(e.target.value as PredictionChoice)}
            className="mb-4"
          >
            <option value={PredictionChoice.HOME_WIN}>برد میزبان</option>
            <option value={PredictionChoice.DRAW}>مساوی</option>
            <option value={PredictionChoice.AWAY_WIN}>برد میهمان</option>
          </AdminSelect>

          {summary && (
            <div className="mb-4 rounded-xl bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">
              تسویه شد: {summary.correctCount} درست، {summary.wrongCount} نادرست
            </div>
          )}

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
