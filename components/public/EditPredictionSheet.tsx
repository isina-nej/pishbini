"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { PredictionChoice } from "@/generated/prisma";
import type { ProfilePrediction } from "@/lib/profile-service";
import { cn } from "@/lib/utils";

type Props = {
  prediction: ProfilePrediction | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditPredictionSheet({ prediction, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (choice: PredictionChoice) => {
    if (!prediction || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/predictions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: prediction.matchId, prediction: choice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ویرایش");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {prediction && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="بستن"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="relative z-10 w-full max-w-[430px] rounded-t-[1.75rem] border border-white/10 bg-[#121322] p-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">ویرایش پیش‌بینی</h3>
                <p className="mt-1 text-xs text-white/50">{prediction.matchLabel}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-white/50 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2">
              <ChoiceButton
                label={`برد ${prediction.homeTeamName}`}
                selected={prediction.prediction === PredictionChoice.HOME_WIN}
                disabled={saving}
                onClick={() => save(PredictionChoice.HOME_WIN)}
              />
              <ChoiceButton
                label="مساوی"
                selected={prediction.prediction === PredictionChoice.DRAW}
                disabled={saving}
                onClick={() => save(PredictionChoice.DRAW)}
              />
              <ChoiceButton
                label={`برد ${prediction.awayTeamName}`}
                selected={prediction.prediction === PredictionChoice.AWAY_WIN}
                disabled={saving}
                onClick={() => save(PredictionChoice.AWAY_WIN)}
              />
            </div>

            {saving && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60">
                <Loader2 className="size-4 animate-spin" />
                در حال ذخیره...
              </div>
            )}
            {error && (
              <p className="mt-3 text-center text-sm text-danger">{error}</p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ChoiceButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border py-3 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/15 text-primary"
          : "border-white/10 bg-white/5 text-white/80 hover:border-white/20"
      )}
    >
      {label}
    </button>
  );
}
