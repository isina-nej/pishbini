"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PredictionChoice } from "@/generated/prisma";
import { formatPersianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { TeamFlag } from "@/components/public/TeamFlag";

export type MatchStats = {
  homeWinPercent: number;
  drawPercent: number;
  awayWinPercent: number;
  total: number;
};

export type MatchData = {
  id: string;
  homeTeam: { nameFa: string; code: string; flagUrl: string };
  awayTeam: { nameFa: string; code: string; flagUrl: string };
  startTime: string;
  stats?: MatchStats;
};

type Props = {
  match: MatchData;
  selected?: PredictionChoice | null;
  onSelect: (choice: PredictionChoice) => void;
  index: number;
  confirmed?: boolean;
};

function formatPercent(n: number) {
  return `${n.toLocaleString("fa-IR")}٪`;
}

function FlagBg({
  code,
  loading,
  dimmed,
  shadow,
}: {
  code: string;
  loading: "eager" | "lazy";
  dimmed?: boolean;
  shadow?: boolean;
}) {
  return (
    <>
      <TeamFlag
        src=""
        code={code}
        alt=""
        fill
        loading={loading}
        className={cn(
          "transition-opacity duration-500",
          dimmed ? "opacity-[0.06]" : "opacity-20"
        )}
      />
      {shadow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10"
        />
      )}
    </>
  );
}

function StatsPanel({ percent, label }: { percent: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12, duration: 0.45 }}
      className="flex w-[38%] shrink-0 flex-col items-center justify-center gap-2 border-r border-white/10 px-3 py-4"
    >
      <span className="text-2xl font-bold">{formatPercent(percent)}</span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percent, 2)}%` }}
          transition={{ delay: 0.25, duration: 0.65, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-l from-primary to-secondary"
        />
      </div>
      <span className="text-center text-[10px] leading-tight text-white/50">{label}</span>
    </motion.div>
  );
}

function SelectedTeamPanel({
  nameFa,
  code,
  loading,
  fromLeft,
}: {
  nameFa: string;
  code: string;
  loading: "eager" | "lazy";
  fromLeft?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={fromLeft ? { x: -80, opacity: 0.5 } : false}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden py-5"
    >
      <FlagBg code={code} loading={loading} shadow />
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="relative h-11 w-14 overflow-hidden rounded-lg shadow-lg ring-2 ring-primary/45">
          <TeamFlag src="" code={code} alt={nameFa} fill loading={loading} />
        </div>
        <span className="text-sm font-semibold">{nameFa}</span>
        <span className="text-[10px] text-white/50">{code}</span>
        <span className="text-[10px] text-primary">انتخاب شما</span>
      </div>
    </motion.div>
  );
}

export function MatchCard({ match, selected, onSelect, index, confirmed = false }: Props) {
  const flagLoading = index === 0 ? "eager" : "lazy";
  const stats = match.stats ?? { homeWinPercent: 0, drawPercent: 0, awayWinPercent: 0, total: 0 };

  const selectedPercent =
    selected === PredictionChoice.HOME_WIN
      ? stats.homeWinPercent
      : selected === PredictionChoice.AWAY_WIN
        ? stats.awayWinPercent
        : selected === PredictionChoice.DRAW
          ? stats.drawPercent
          : 0;

  const selectedLabel =
    selected === PredictionChoice.HOME_WIN
      ? `برد ${match.homeTeam.nameFa}`
      : selected === PredictionChoice.AWAY_WIN
        ? `برد ${match.awayTeam.nameFa}`
        : "مساوی";

  const showConfirmed = confirmed && selected;
  const isSelecting = !confirmed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn("glass-card mx-4 mb-4 overflow-hidden", showConfirmed && "glow-selected")}
    >
      <p className="border-b border-white/10 py-2.5 text-center text-xs text-white/65">
        {formatPersianDateTime(match.startTime)}
      </p>

      <div className="flex min-h-[92px]">
        {showConfirmed && selected !== PredictionChoice.DRAW && (
          <>
            <SelectedTeamPanel
              nameFa={
                selected === PredictionChoice.HOME_WIN
                  ? match.homeTeam.nameFa
                  : match.awayTeam.nameFa
              }
              code={
                selected === PredictionChoice.HOME_WIN ? match.homeTeam.code : match.awayTeam.code
              }
              loading={flagLoading}
              fromLeft={selected === PredictionChoice.AWAY_WIN}
            />
            <StatsPanel percent={selectedPercent} label={selectedLabel} />
          </>
        )}

        {showConfirmed && selected === PredictionChoice.DRAW && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex flex-1 flex-col items-center justify-center gap-2 py-5"
            >
              <div className="absolute inset-0 flex">
                <div className="relative flex-1 overflow-hidden">
                  <FlagBg code={match.homeTeam.code} loading={flagLoading} shadow />
                </div>
                <div className="relative flex-1 overflow-hidden">
                  <FlagBg code={match.awayTeam.code} loading={flagLoading} shadow />
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative h-8 w-11 overflow-hidden rounded-md shadow-md ring-1 ring-white/25">
                  <TeamFlag
                    src=""
                    code={match.homeTeam.code}
                    alt={match.homeTeam.nameFa}
                    fill
                    loading={flagLoading}
                  />
                </div>
                <span className="text-sm font-bold">مساوی</span>
                <div className="relative h-8 w-11 overflow-hidden rounded-md shadow-md ring-1 ring-white/25">
                  <TeamFlag
                    src=""
                    code={match.awayTeam.code}
                    alt={match.awayTeam.nameFa}
                    fill
                    loading={flagLoading}
                  />
                </div>
              </div>
              <span className="relative z-10 text-[10px] text-primary">انتخاب شما</span>
            </motion.div>
            <StatsPanel percent={selectedPercent} label={selectedLabel} />
          </>
        )}

        {isSelecting && (
          <div className="flex flex-1">
            <button
              type="button"
              onClick={() => onSelect(PredictionChoice.HOME_WIN)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center overflow-hidden border-l border-white/10 p-3 transition-all",
                selected === PredictionChoice.HOME_WIN && "glow-selected z-10 bg-primary/5"
              )}
            >
              <FlagBg code={match.homeTeam.code} loading={flagLoading} />
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "relative h-10 w-14 overflow-hidden rounded-lg",
                    selected === PredictionChoice.HOME_WIN && "ring-2 ring-primary/60"
                  )}
                >
                  <TeamFlag
                    src=""
                    code={match.homeTeam.code}
                    alt={match.homeTeam.nameFa}
                    fill
                    loading={flagLoading}
                  />
                </div>
                <span className="text-sm font-semibold">{match.homeTeam.nameFa}</span>
                <span className="text-[10px] text-white/50">{match.homeTeam.code}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelect(PredictionChoice.AWAY_WIN)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center overflow-hidden p-3 transition-all",
                selected === PredictionChoice.AWAY_WIN && "glow-selected z-10 bg-primary/5"
              )}
            >
              <FlagBg code={match.awayTeam.code} loading={flagLoading} />
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "relative h-10 w-14 overflow-hidden rounded-lg",
                    selected === PredictionChoice.AWAY_WIN && "ring-2 ring-primary/60"
                  )}
                >
                  <TeamFlag
                    src=""
                    code={match.awayTeam.code}
                    alt={match.awayTeam.nameFa}
                    fill
                    loading={flagLoading}
                  />
                </div>
                <span className="text-sm font-semibold">{match.awayTeam.nameFa}</span>
                <span className="text-[10px] text-white/50">{match.awayTeam.code}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {isSelecting && (
        <button
          type="button"
          onClick={() => onSelect(PredictionChoice.DRAW)}
          className={cn(
            "w-full border-t border-white/10 py-2.5 text-xs font-medium transition-all",
            selected === PredictionChoice.DRAW
              ? "glow-selected bg-gradient-to-r from-primary/15 to-secondary/15 text-primary"
              : "text-white/60 hover:bg-white/5"
          )}
        >
          مساوی
        </button>
      )}
    </motion.div>
  );
}
