"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PredictionChoice } from "@/generated/prisma";
import { EmptyState } from "@/components/public/EmptyState";
import { ErrorState } from "@/components/public/ErrorState";
import { LeaderboardPodium } from "@/components/public/LeaderboardPodium";
import type { LeaderboardUser } from "@/components/public/LeaderboardCard";
import { LoadingState } from "@/components/public/LoadingState";
import { MatchCard, type MatchData } from "@/components/public/MatchCard";
import { GlassTopNav } from "@/components/public/GlassTopNav";
import { PredictionsHero } from "@/components/public/PredictionsHero";
import { SubmitPredictionsBar, SubmitPredictionsBarSpacer } from "@/components/public/SubmitPredictionsBar";
import { SubmitOtpModal } from "@/components/public/SubmitOtpModal";
import {
  getStoredPredictions,
  setStoredPredictions,
  type StoredPrediction,
} from "@/lib/predictions-storage";
import { notifyShowPushPrompt } from "@/lib/push-prompt-events";
import { useTabData } from "@/hooks/useTabData";
import { fingerprintMatches, stableFingerprint } from "@/lib/tab-data-cache";
import { useSetTabPageMeta } from "@/lib/tab-page-meta";

type SavedPick = {
  prediction: PredictionChoice;
  canEdit: boolean;
};

type HomeData = {
  matches: MatchData[];
  leaderboard: LeaderboardUser[];
  predictions: Record<string, PredictionChoice>;
  savedPicks: Record<string, SavedPick>;
};

async function fetchHomeData(): Promise<HomeData> {
  const stored = getStoredPredictions();
  const map: Record<string, PredictionChoice> = {};
  stored.forEach((p) => {
    map[p.matchId] = p.prediction;
  });

  const [matchesRes, picksRes, leaderboardRes] = await Promise.all([
    fetch("/api/matches"),
    fetch("/api/me/predictions", { credentials: "include" }),
    fetch("/api/leaderboard"),
  ]);
  const matchesData = await matchesRes.json();
  const picksData = await picksRes.json();
  const leaderboardData = await leaderboardRes.json();
  if (matchesData.error) throw new Error(matchesData.error);
  if (leaderboardData.error) throw new Error(leaderboardData.error);

  const matches = matchesData.matches ?? [];
  const leaderboard = leaderboardData.users ?? [];
  const saved: Record<string, SavedPick> = {};
  const merged = { ...map };
  for (const row of picksData.predictions ?? []) {
    saved[row.matchId] = {
      prediction: row.prediction,
      canEdit: row.canEdit,
    };
    merged[row.matchId] = row.prediction;
  }

  return { matches, leaderboard, predictions: merged, savedPicks: saved };
}

export default function HomePage() {
  const router = useRouter();
  const { data, error, isInitialLoad } = useTabData("matches", fetchHomeData, {
    fingerprint: (home) =>
      stableFingerprint({
        matches: fingerprintMatches(home.matches),
        saved: Object.keys(home.savedPicks).sort(),
      }),
  });

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [predictions, setPredictions] = useState<Record<string, PredictionChoice>>({});
  const [savedPicks, setSavedPicks] = useState<Record<string, SavedPick>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setMatches(data.matches);
    setLeaderboard(data.leaderboard);
    setPredictions(data.predictions);
    setSavedPicks(data.savedPicks);
  }, [data]);

  useSetTabPageMeta({
    tourReady: !isInitialLoad && !error,
    tourHasMatches: matches.length > 0,
  });

  const persistDraft = useCallback(
    (next: Record<string, PredictionChoice>) => {
      const list: StoredPrediction[] = Object.entries(next)
        .filter(([matchId]) => !savedPicks[matchId])
        .map(([matchId, prediction]) => ({ matchId, prediction }));
      setStoredPredictions(list);
    },
    [savedPicks]
  );

  const handleSelect = async (matchId: string, choice: PredictionChoice) => {
    setPatchError(null);
    const isFirstPick = Object.keys(predictions).length === 0;

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
        const resData = await res.json();
        if (!res.ok) {
          setPatchError(resData.error ?? "خطا در ویرایش پیش‌بینی");
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

    if (isFirstPick) {
      notifyShowPushPrompt();
    }
  };

  const newPicksCount = Object.keys(predictions).filter((id) => !savedPicks[id]).length;

  return (
    <>
      <PredictionsHero />
      <GlassTopNav />

      <div className="relative z-10">
        <div className="predictions-hero-spacer" aria-hidden />

        <div className="predictions-content-scrim pb-32">
          <p className="mb-4 px-4 text-center text-sm text-white/65">
            برندگان نهایی ایونت
          </p>

          {!isInitialLoad && !error && leaderboard.length > 0 && <LeaderboardPodium users={leaderboard} />}

          <p className="mb-4 px-4 text-center text-xs text-white/45">
            ثبت‌نام ایونت بعدی به‌زودی فعال می‌شود
          </p>

          {isInitialLoad && <LoadingState />}
          {error && <ErrorState message={error} />}
          {patchError && (
            <p className="mx-4 mb-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-center text-sm text-danger">
              {patchError}
            </p>
          )}
          {!isInitialLoad && !error && (
            <div className="mx-4 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
              <p className="text-sm font-semibold text-white/85">این ایونت به پایان رسیده است</p>
              <p className="mt-2 text-xs leading-6 text-white/50">
                فقط برندگان نهایی نمایش داده می‌شوند. ثبت‌نام ایونت‌های بعدی از همین صفحه انجام می‌شود.
              </p>
            </div>
          )}

          <SubmitPredictionsBarSpacer visible={!modalOpen} />
        </div>
      </div>

      <SubmitPredictionsBar
        count={modalOpen ? 0 : newPicksCount}
        onSubmit={() => {
          if (document.documentElement.dataset.tourStep === "submit") return;
          setModalOpen(true);
        }}
      />

      <SubmitOtpModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(successData) => {
          sessionStorage.setItem("wc_success", JSON.stringify(successData));
          router.push("/success");
        }}
      />
    </>
  );
}
