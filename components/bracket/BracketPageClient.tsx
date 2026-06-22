"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BracketStage } from "@/generated/prisma";
import { BracketMatchCard } from "./BracketMatchCard";
import { BRACKET_STAGES, STAGE_LABELS, STAGE_TAB_SHORT } from "@/lib/bracket/constants";
import {
  computeProgress,
  deriveChampion,
  isBracketComplete,
  resolveAllMatches,
  selectWinner,
} from "@/lib/bracket/progression";
import { clearDraft, hasRestoredDraft, loadDraft, saveDraft } from "@/lib/bracket/storage";
import type { BracketPicks, BracketTree } from "@/lib/bracket/types";
import { cn } from "@/lib/utils";

type ApiResponse = {
  enabled: boolean;
  published: boolean;
  submissionOpen: boolean;
  invalid?: boolean;
  matches: BracketTree["matches"];
  teams: BracketTree["teams"];
};

export function BracketPageClient() {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<BracketTree | null>(null);
  const [picks, setPicks] = useState<BracketPicks>({});
  const [activeStage, setActiveStage] = useState<BracketStage>(BracketStage.ROUND_OF_32);
  const [showRestored, setShowRestored] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [meta, setMeta] = useState<{ published: boolean; submissionOpen: boolean }>({
    published: false,
    submissionOpen: true,
  });

  useEffect(() => {
    fetch("/api/bracket")
      .then(async (r) => {
        const data = (await r.json()) as ApiResponse & { error?: string };
        if (!r.ok || data.error) {
          setError(data.error ?? "خطا در بارگذاری جدول حذفی");
          return;
        }
        if (data.invalid) {
          setError("اطلاعات جدول حذفی کامل نیست. لطفاً بعداً دوباره تلاش کنید.");
          return;
        }
        if (!data.published || !data.enabled) {
          setError("جدول مرحله حذفی هنوز منتشر نشده است.");
          return;
        }
        const t: BracketTree = { matches: data.matches, teams: data.teams };
        setTree(t);
        setMeta({ published: data.published, submissionOpen: data.submissionOpen });
        const draft = loadDraft(t);
        setPicks(draft);
        if (hasRestoredDraft() && Object.keys(draft).length > 0) {
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 4000);
        }
      })
      .catch(() => setError("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const resolved = useMemo(
    () => (tree ? resolveAllMatches(tree, picks) : []),
    [tree, picks]
  );

  const progress = useMemo(
    () => (tree ? computeProgress(picks, tree) : { completed: 0, total: 31 }),
    [tree, picks]
  );

  const champion = useMemo(
    () => (tree ? deriveChampion(picks, tree) : null),
    [tree, picks]
  );

  const complete = tree ? isBracketComplete(picks, tree) : false;

  const handleSelect = useCallback(
    (matchId: string, teamId: string) => {
      if (!tree || !meta.submissionOpen) return;
      setPicks((prev) => {
        const next = selectWinner(prev, tree, matchId, teamId);
        saveDraft(next);
        return next;
      });
    },
    [tree, meta.submissionOpen]
  );

  const scrollToStage = (stage: BracketStage) => {
    setActiveStage(stage);
    const el = document.getElementById(`bracket-stage-${stage}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const onScroll = () => {
      for (const stage of BRACKET_STAGES) {
        const el = document.getElementById(`bracket-stage-${stage}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.left >= 0 && rect.left < window.innerWidth * 0.5) {
          setActiveStage(stage);
          break;
        }
      }
    };
    board.addEventListener("scroll", onScroll, { passive: true });
    return () => board.removeEventListener("scroll", onScroll);
  }, [tree]);

  const handleReset = () => {
    clearDraft();
    setPicks({});
    setResetOpen(false);
    scrollToStage(BracketStage.ROUND_OF_32);
  };

  const handleSubmit = () => {
    if (!complete) return;
    sessionStorage.setItem("wc_bracket_picks", JSON.stringify(picks));
    sessionStorage.setItem("wc_bracket_champion", champion?.id ?? "");
    router.push("/bracket/submit");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--bracket-primary)] border-t-transparent" />
        <p className="text-sm text-[var(--bracket-text-muted)]">در حال آماده‌سازی جدول حذفی...</p>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--bracket-text-muted)]">
          {error ?? "جدول مرحله حذفی هنوز منتشر نشده است."}
        </p>
      </div>
    );
  }

  if (!meta.submissionOpen) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--bracket-text-muted)]">
          مهلت ثبت پیش‌بینی جدول حذفی به پایان رسیده است.
        </p>
      </div>
    );
  }

  const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--bracket-border)] bg-[var(--bracket-bg)]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">مسیر قهرمانی را پیش‌بینی کنید</h1>
            <p className="mt-0.5 text-xs text-[var(--bracket-text-muted)]">
              برنده هر مسابقه را انتخاب کنید تا تیم‌ها مرحله‌به‌مرحله به فینال برسند.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="shrink-0 rounded-lg border border-[var(--bracket-border)] px-3 py-1.5 text-xs text-[var(--bracket-text-muted)] hover:border-[var(--bracket-primary)]"
          >
            شروع دوباره
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-[var(--bracket-text-muted)]">
            <span>
              {progress.completed.toLocaleString("fa-IR")} از{" "}
              {progress.total.toLocaleString("fa-IR")} انتخاب انجام شده
            </span>
            <span>{Math.round(progressPct).toLocaleString("fa-IR")}٪</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[var(--bracket-primary)] to-[var(--bracket-secondary)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {showRestored && (
          <p className="mt-2 text-xs text-[var(--bracket-primary)]">
            انتخاب‌های ذخیره‌شده شما بازیابی شد.
          </p>
        )}
      </header>

      <nav className="sticky top-[var(--bracket-header-offset,8.5rem)] z-20 border-b border-[var(--bracket-border)] bg-[var(--bracket-surface)]/95 backdrop-blur-md">
        <div className="bracket-scroll flex gap-1 px-3 py-2">
          {BRACKET_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => scrollToStage(stage)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeStage === stage
                  ? "bg-[var(--bracket-primary)]/20 text-[var(--bracket-primary)]"
                  : "text-[var(--bracket-text-muted)] hover:bg-white/5"
              )}
            >
              {STAGE_TAB_SHORT[stage]}
            </button>
          ))}
        </div>
      </nav>

      <div
        ref={boardRef}
        className="bracket-scroll flex gap-4 px-4 py-4"
        role="region"
        aria-label="جدول حذفی"
      >
        {BRACKET_STAGES.map((stage) => {
          const stageMatches = resolved.filter((m) => m.stage === stage);
          return (
            <section
              key={stage}
              id={`bracket-stage-${stage}`}
              className="bracket-column flex flex-col gap-3"
              aria-label={STAGE_LABELS[stage]}
            >
              <h2 className="text-center text-sm font-semibold text-[var(--bracket-text-muted)]">
                {STAGE_LABELS[stage]}
              </h2>
              {stageMatches.map((m, i) => (
                <BracketMatchCard
                  key={m.matchId}
                  match={m}
                  onSelect={(teamId) => handleSelect(m.matchId, teamId)}
                  index={i}
                />
              ))}
            </section>
          );
        })}
      </div>

      {champion && complete && (
        <div className="mx-4 mb-4 rounded-2xl border border-[var(--bracket-champion)]/40 bg-gradient-to-br from-[var(--bracket-surface-elevated)] to-[var(--bracket-surface)] p-5 text-center">
          <p className="text-xs text-[var(--bracket-text-muted)]">قهرمان پیش‌بینی‌شده شما</p>
          <div className="mt-3 flex flex-col items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🏆
            </span>
            <div className="relative h-14 w-20 overflow-hidden rounded-lg">
              <Image
                src={champion.flagUrl}
                alt={champion.nameFa}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <p className="text-xl font-bold text-[var(--bracket-champion)]">{champion.nameFa}</p>
            <p className="text-xs text-[var(--bracket-text-muted)]">{champion.code}</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--bracket-border)] bg-[var(--bracket-bg)]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <button
          type="button"
          disabled={!complete}
          onClick={handleSubmit}
          className={cn(
            "w-full rounded-2xl py-4 text-sm font-bold transition-opacity",
            complete
              ? "bg-gradient-to-r from-[var(--bracket-primary)] to-[var(--bracket-secondary)] text-[#090d1a]"
              : "cursor-not-allowed bg-white/10 text-[var(--bracket-text-muted)]"
          )}
        >
          {complete ? "ثبت نهایی پیش‌بینی قهرمان" : "ابتدا همه مراحل را تکمیل کنید"}
        </button>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--bracket-border)] bg-[var(--bracket-surface-elevated)] p-6">
            <p className="text-center text-sm">همه انتخاب‌های شما پاک می‌شود. مطمئن هستید؟</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="flex-1 rounded-xl border border-[var(--bracket-border)] py-2.5 text-sm"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-xl bg-[var(--bracket-primary)] py-2.5 text-sm font-bold text-[#090d1a]"
              >
                پاک کردن انتخاب‌ها
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
