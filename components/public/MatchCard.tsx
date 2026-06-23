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
  submitted?: boolean;
  locked?: boolean;
};

type TeamInfo = { nameFa: string; code: string; flagUrl: string };

const NAME_STRIP_H = "h-[22px]";

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

function DrawCenterBadge({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <div className="rounded-full bg-white px-5 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <span className="text-sm font-bold text-[#10111f]">مساوی</span>
      </div>
    </motion.div>
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

function SelectableFlag({
  team,
  selected,
  hasTeamPick,
  drawSelected,
  onSelect,
  loading,
  reduceMotion,
}: {
  team: TeamInfo;
  selected: boolean;
  hasTeamPick: boolean;
  drawSelected: boolean;
  onSelect: () => void;
  loading: "eager" | "lazy";
  reduceMotion: boolean;
}) {
  const dimmed = drawSelected || (hasTeamPick && !selected);

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
      {dimmed && (
        <ShadowOverlay className={drawSelected ? "bg-black/55" : undefined} />
      )}
    </motion.button>
  );
}

function TeamNameStrip({
  name,
  flex,
  selected,
  drawSelected,
}: {
  name: string;
  flex: number;
  selected: boolean;
  drawSelected: boolean;
}) {
  return (
    <motion.span
      layout
      animate={{ flex }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className={cn(
        "min-w-0 truncate border-t border-white/10 px-1 py-1.5 text-center text-[10px] font-medium leading-tight",
        NAME_STRIP_H,
        selected && !drawSelected ? "text-primary" : "text-white/75",
        drawSelected && "text-white/50"
      )}
    >
      {name}
    </motion.span>
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
      className="relative w-full overflow-hidden rounded-2xl"
    >
      {isDraw ? (
        <div className="relative">
          <div className="relative flex h-[96px]">
            <div className="relative flex-1 overflow-hidden">
              <PureFlag team={match.homeTeam} loading={loading} />
              <ShadowOverlay className="bg-black/55" />
            </div>
            <div className="relative flex-1 overflow-hidden">
              <PureFlag team={match.awayTeam} loading={loading} />
              <ShadowOverlay className="bg-black/55" />
            </div>
            <DrawCenterBadge reduceMotion={!!reduceMotion} />
          </div>
          <div className="flex border-t border-white/10 bg-[#0d0e1a]">
            <span
              className={cn(
                "flex-1 truncate px-1 py-1.5 text-center text-[10px] font-medium text-white/50",
                NAME_STRIP_H
              )}
            >
              {match.homeTeam.nameFa}
            </span>
            <span
              className={cn(
                "flex-1 truncate px-1 py-1.5 text-center text-[10px] font-medium text-white/50",
                NAME_STRIP_H
              )}
            >
              {match.awayTeam.nameFa}
            </span>
          </div>
        </div>
      ) : winTeam ? (
        <div className="relative">
          <div className="relative h-[96px] overflow-hidden">
            <PureFlag team={winTeam} loading={loading} />
          </div>
          <span
            className={cn(
              "block truncate border-t border-white/10 bg-[#0d0e1a] px-2 py-1.5 text-center text-[10px] font-medium text-primary",
              NAME_STRIP_H
            )}
          >
            {winTeam.nameFa}
          </span>
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

export function MatchCard({
  match,
  selected,
  onSelect,
  index,
  confirmed = false,
  submitted = false,
  locked = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const flagLoading = index === 0 ? "eager" : "lazy";

  const homeSelected = selected === PredictionChoice.HOME_WIN;
  const awaySelected = selected === PredictionChoice.AWAY_WIN;
  const drawSelected = selected === PredictionChoice.DRAW;
  const hasTeamPick = homeSelected || awaySelected;
  const showConfirmed = (confirmed || locked) && submitted && selected;
  const isSelecting = !showConfirmed;

  const homeNameFlex = hasTeamPick ? (homeSelected ? 4 : 1) : 1;
  const awayNameFlex = hasTeamPick ? (awaySelected ? 4 : 1) : 1;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5 px-1.5"
    >
      {submitted && !locked && (
        <p className="mb-1 text-center text-[10px] font-medium text-primary/90">
          ثبت‌شده — قابل ویرایش
        </p>
      )}
      {submitted && locked && (
        <p className="mb-1 text-center text-[10px] font-medium text-white/45">
          ثبت‌شده
        </p>
      )}
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
            <div className="relative flex h-[96px] w-full">
              <SelectableFlag
                team={match.homeTeam}
                selected={homeSelected}
                hasTeamPick={hasTeamPick}
                drawSelected={drawSelected}
                onSelect={() => onSelect(PredictionChoice.HOME_WIN)}
                loading={flagLoading}
                reduceMotion={!!reduceMotion}
              />
              <SelectableFlag
                team={match.awayTeam}
                selected={awaySelected}
                hasTeamPick={hasTeamPick}
                drawSelected={drawSelected}
                onSelect={() => onSelect(PredictionChoice.AWAY_WIN)}
                loading={flagLoading}
                reduceMotion={!!reduceMotion}
              />
              <AnimatePresence>
                {drawSelected && (
                  <DrawCenterBadge
                    key="draw-badge"
                    reduceMotion={!!reduceMotion}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="flex bg-[#0d0e1a]">
              <TeamNameStrip
                name={match.homeTeam.nameFa}
                flex={homeNameFlex}
                selected={homeSelected}
                drawSelected={drawSelected}
              />
              <TeamNameStrip
                name={match.awayTeam.nameFa}
                flex={awayNameFlex}
                selected={awaySelected}
                drawSelected={drawSelected}
              />
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
