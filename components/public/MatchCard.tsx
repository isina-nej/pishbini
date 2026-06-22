"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

type TeamInfo = { nameFa: string; code: string; flagUrl: string };

function PureFlag({
  team,
  loading,
}: {
  team: TeamInfo;
  loading: "eager" | "lazy";
}) {
  return (
    <TeamFlag
      src=""
      code={team.code}
      alt={team.nameFa}
      fill
      loading={loading}
      className="object-cover object-center"
    />
  );
}

function ShadowOverlay({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={cn("absolute inset-0 bg-black/60", className)}
    />
  );
}

function DateTimeOnShadow({ startTime }: { startTime: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="px-2 text-center text-[11px] font-medium leading-snug text-white/90"
    >
      {formatPersianDateTime(startTime)}
    </motion.p>
  );
}

function SelectablePanel({
  team,
  selected,
  hasTeamPick,
  onSelect,
  loading,
  reduceMotion,
}: {
  team: TeamInfo;
  selected: boolean;
  hasTeamPick: boolean;
  onSelect: () => void;
  loading: "eager" | "lazy";
  reduceMotion: boolean;
}) {
  const dimmed = hasTeamPick && !selected;

  return (
    <motion.button
      type="button"
      layout
      onClick={onSelect}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      animate={{
        flex: hasTeamPick ? (selected ? 4 : 1) : 1,
      }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="relative h-full min-w-0 overflow-hidden"
      aria-label={team.nameFa}
    >
      <PureFlag team={team} loading={loading} />
      {dimmed && <ShadowOverlay />}
    </motion.button>
  );
}

function ConfirmedCard({
  match,
  selected,
  loading,
  reduceMotion,
}: {
  match: MatchData;
  selected: PredictionChoice;
  loading: "eager" | "lazy";
  reduceMotion: boolean;
}) {
  const isDraw = selected === PredictionChoice.DRAW;
  const winTeam =
    selected === PredictionChoice.HOME_WIN
      ? match.homeTeam
      : selected === PredictionChoice.AWAY_WIN
        ? match.awayTeam
        : null;

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0.85, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[118px] w-full overflow-hidden rounded-2xl"
    >
      {isDraw ? (
        <div className="absolute inset-0 flex">
          <div className="relative flex-1 overflow-hidden">
            <PureFlag team={match.homeTeam} loading={loading} />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <PureFlag team={match.awayTeam} loading={loading} />
          </div>
        </div>
      ) : winTeam ? (
        <div className="absolute inset-0">
          <PureFlag team={winTeam} loading={loading} />
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, width: "0%" }}
        animate={{ opacity: 1, width: "28%" }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-gradient-to-l from-black/85 via-black/55 to-transparent"
      >
        <DateTimeOnShadow startTime={match.startTime} />
      </motion.div>
    </motion.div>
  );
}

export function MatchCard({ match, selected, onSelect, index, confirmed = false }: Props) {
  const reduceMotion = useReducedMotion();
  const flagLoading = index === 0 ? "eager" : "lazy";

  const homeSelected = selected === PredictionChoice.HOME_WIN;
  const awaySelected = selected === PredictionChoice.AWAY_WIN;
  const drawSelected = selected === PredictionChoice.DRAW;
  const hasTeamPick = homeSelected || awaySelected;
  const showConfirmed = confirmed && selected;
  const isSelecting = !confirmed;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5 px-1.5"
    >
      <AnimatePresence mode="wait" initial={false}>
        {showConfirmed ? (
          <ConfirmedCard
            key="confirmed"
            match={match}
            selected={selected}
            loading={flagLoading}
            reduceMotion={!!reduceMotion}
          />
        ) : (
          <motion.div
            key="selecting"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "overflow-hidden rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.35)]",
              drawSelected && "ring-1 ring-primary/50"
            )}
          >
            <div className="relative flex h-[118px] w-full">
              <SelectablePanel
                team={match.homeTeam}
                selected={homeSelected}
                hasTeamPick={hasTeamPick}
                onSelect={() => onSelect(PredictionChoice.HOME_WIN)}
                loading={flagLoading}
                reduceMotion={!!reduceMotion}
              />
              <SelectablePanel
                team={match.awayTeam}
                selected={awaySelected}
                hasTeamPick={hasTeamPick}
                onSelect={() => onSelect(PredictionChoice.AWAY_WIN)}
                loading={flagLoading}
                reduceMotion={!!reduceMotion}
              />
              {drawSelected && (
                <div className="pointer-events-none absolute inset-0 bg-black/25" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSelecting && (
        <p className="mt-2 text-center text-[11px] text-white/45">
          {formatPersianDateTime(match.startTime)}
        </p>
      )}

      {isSelecting && (
        <motion.button
          type="button"
          onClick={() => onSelect(PredictionChoice.DRAW)}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className={cn(
            "mt-1 w-full py-2 text-xs font-medium transition-colors",
            drawSelected ? "text-primary" : "text-white/45 hover:text-white/65"
          )}
        >
          مساوی
        </motion.button>
      )}
    </motion.div>
  );
}
