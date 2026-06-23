"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PredictionChoice } from "@/generated/prisma";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { EmptyState } from "@/components/public/EmptyState";
import { ErrorState } from "@/components/public/ErrorState";
import { LoadingState } from "@/components/public/LoadingState";
import { MatchCard, type MatchData } from "@/components/public/MatchCard";
import { SubmitOtpModal } from "@/components/public/SubmitOtpModal";
import {
  getStoredPredictions,
  setStoredPredictions,
  type StoredPrediction,
} from "@/lib/predictions-storage";

type SavedPick = {
  prediction: PredictionChoice;
  canEdit: boolean;
};

export default function HomePage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [predictions, setPredictions] = useState<Record<string, PredictionChoice>>({});
  const [savedPicks, setSavedPicks] = useState<Record<string, SavedPick>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredPredictions();
    const map: Record<string, PredictionChoice> = {};
    stored.forEach((p) => {
      map[p.matchId] = p.prediction;
    });

    Promise.all([
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/me/predictions", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([matchesData, picksData]) => {
        if (matchesData.error) throw new Error(matchesData.error);
        setMatches(matchesData.matches ?? []);

        const saved: Record<string, SavedPick> = {};
        const merged = { ...map };
        for (const row of picksData.predictions ?? []) {
          saved[row.matchId] = {
            prediction: row.prediction,
            canEdit: row.canEdit,
          };
          merged[row.matchId] = row.prediction;
        }
        setSavedPicks(saved);
        setPredictions(merged);
      })
      .catch(() => setError("خطا در دریافت بازی‌ها"))
      .finally(() => setLoading(false));
  }, []);

  const persistDraft = useCallback((next: Record<string, PredictionChoice>) => {
    const list: StoredPrediction[] = Object.entries(next)
      .filter(([matchId]) => !savedPicks[matchId])
      .map(([matchId, prediction]) => ({ matchId, prediction }));
    setStoredPredictions(list);
  }, [savedPicks]);

  const handleSelect = async (matchId: string, choice: PredictionChoice) => {
    setPatchError(null);

    if (savedPicks[matchId]) {
      if (!savedPicks[matchId].canEdit) return;

      setPredictions((prev) => ({ ...prev, [matchId]: choice }));

      try {
        const res = await fetch("/api/me/predictions", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, prediction: choice }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPatchError(data.error ?? "خطا در ویرایش پیش‌بینی");
          setPredictions((prev) => ({
            ...prev,
            [matchId]: savedPicks[matchId].prediction,
          }));
          return;
        }
        setSavedPicks((prev) => ({
          ...prev,
          [matchId]: { ...prev[matchId], prediction: choice },
        }));
      } catch {
        setPatchError("خطا در ارتباط با سرور");
        setPredictions((prev) => ({
          ...prev,
          [matchId]: savedPicks[matchId].prediction,
        }));
      }
      return;
    }

    setPredictions((prev) => {
      const next = { ...prev, [matchId]: choice };
      persistDraft(next);
      return next;
    });
  };

  const newPicksCount = Object.keys(predictions).filter((id) => !savedPicks[id]).length;

  return (
    <>
      <PublicPageShell
        pageId="predictions"
        tourReady={!loading && !error}
        tourHasMatches={matches.length > 0}
      >
        <div className="pb-28 pt-6">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 text-center"
            data-tour="home-header"
          >
            <h1 className="bg-gradient-to-l from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
              پیش‌بینی جام جهانی
            </h1>
            <p className="mt-1 text-sm text-white/65">بازی‌های ۲۴ ساعت آینده</p>
          </motion.header>

          {loading && <LoadingState />}
          {error && <ErrorState message={error} />}
          {patchError && (
            <p className="mx-4 mb-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-center text-sm text-danger">
              {patchError}
            </p>
          )}
          {!loading && !error && matches.length === 0 && (
            <EmptyState
              title="بازی فعالی وجود ندارد"
              description="در حال حاضر بازی فعالی برای پیش‌بینی وجود ندارد. لطفاً نزدیک زمان بازی‌های بعدی دوباره مراجعه کنید."
            />
          )}

          {matches.map((match, i) => {
            const saved = savedPicks[match.id];
            return (
              <MatchCard
                key={match.id}
                match={match}
                selected={predictions[match.id]}
                onSelect={(choice) => handleSelect(match.id, choice)}
                index={i}
                submitted={Boolean(saved)}
                locked={saved ? !saved.canEdit : false}
                tourTargets={i === 0}
              />
            );
          })}

          {newPicksCount > 0 && (
            <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-4">
              <motion.button
                type="button"
                data-tour="submit-predictions"
                onClick={() => {
                  if (document.documentElement.dataset.tourStep === "submit") return;
                  setModalOpen(true);
                }}
                whileTap={{ scale: 0.97 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-bold text-[#10111f] shadow-lg shadow-primary/20"
              >
                ثبت پیش‌بینی ({newPicksCount.toLocaleString("fa-IR")})
              </motion.button>
            </div>
          )}
        </div>
      </PublicPageShell>

      <SubmitOtpModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(data) => {
          sessionStorage.setItem("wc_success", JSON.stringify(data));
          router.push("/success");
        }}
      />
    </>
  );
}
