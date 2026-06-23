"use client";

import { useEffect, useState } from "react";
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

export default function HomePage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [predictions, setPredictions] = useState<Record<string, PredictionChoice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredPredictions();
    const map: Record<string, PredictionChoice> = {};
    stored.forEach((p) => {
      map[p.matchId] = p.prediction;
    });
    setPredictions(map);

    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMatches(data.matches ?? []);
      })
      .catch(() => setError("خطا در دریافت بازی‌ها"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (matchId: string, choice: PredictionChoice) => {
    setPredictions((prev) => {
      const next = { ...prev, [matchId]: choice };
      const list: StoredPrediction[] = Object.entries(next).map(([id, prediction]) => ({
        matchId: id,
        prediction,
      }));
      setStoredPredictions(list);
      return next;
    });
  };

  const selectedCount = Object.keys(predictions).length;

  return (
    <>
    <PublicPageShell pageId="predictions">
    <div className="pb-28 pt-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 px-4 text-center"
      >
        <h1 className="bg-gradient-to-l from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
          پیش‌بینی جام جهانی
        </h1>
        <p className="mt-1 text-sm text-white/65">بازی‌های ۲۴ ساعت آینده</p>
      </motion.header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && matches.length === 0 && (
        <EmptyState
          title="بازی فعالی وجود ندارد"
          description="در حال حاضر بازی فعالی برای پیش‌بینی وجود ندارد. لطفاً نزدیک زمان بازی‌های بعدی دوباره مراجعه کنید."
        />
      )}

      {matches.map((match, i) => (
        <MatchCard
          key={match.id}
          match={match}
          selected={predictions[match.id]}
          onSelect={(choice) => handleSelect(match.id, choice)}
          index={i}
          confirmed={false}
        />
      ))}

      {selectedCount > 0 && (
        <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-4">
          <motion.button
            type="button"
            onClick={() => setModalOpen(true)}
            whileTap={{ scale: 0.97 }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-bold text-[#10111f] shadow-lg shadow-primary/20"
          >
            ثبت پیش‌بینی ({selectedCount.toLocaleString("fa-IR")})
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
