"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
} from "framer-motion";
import { PredictionChoice } from "@/generated/prisma";
import { formatPersianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { TeamFlag } from "@/components/public/TeamFlag";
import { MatchMetaRow } from "@/components/public/MatchMetaRow";

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
  tourTargets?: boolean;
};

type TeamInfo = { nameFa: string; code: string; flagUrl: string };

const NAME_STRIP_H = "h-[22px]";
const SELECTED_FLAG_FLEX = 3;
const UNSELECTED_FLAG_FLEX = 2;
const FLAGS_BOX_LAYOUT = "mx-auto w-[85%]";
const DRAW_MORPH_TRANSITION = { type: "spring" as const, stiffness: 380, damping: 32 };
const FLAG_EASE = [0.22, 1, 0.36, 1] as const;
const FLAG_INNER_RADIUS = "rounded-xl";
const FLAG_LAYOUT_SPRING = { type: "spring" as const, stiffness: 300, damping: 34 };
const FLAG_ALIGN_MS = 400;

const FLAGS_BOX_CLASS =
  "relative overflow-hidden ring-1 ring-inset ring-white/15";

function FlagsBox({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn(FLAGS_BOX_CLASS, FLAGS_BOX_LAYOUT, className)} {...props}>
      {children}
    </div>
  );
}

function PureFlag({ team, className }: { team: TeamInfo; className?: string }) {
  return (
    <TeamFlag code={team.code} alt={team.nameFa} fill fit="cover" className={className} />
  );
}

function FlagGhostBackdrop({ team, cardLevel }: { team: TeamInfo; cardLevel?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl"
      aria-hidden
    >
      <TeamFlag
        code={team.code}
        alt=""
        fill
        fit="cover"
        className={cn(
          cardLevel
            ? "scale-[1.5] opacity-[0.14] blur-[6px] saturate-[1.05]"
            : "scale-[1.4] opacity-[0.1] blur-[5px] saturate-[0.9]"
        )}
      />
    </motion.div>
  );
}

function ShadowOverlay({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: FLAG_EASE }}
      className={cn("absolute inset-0 bg-black/60", className)}
    />
  );
}

function DrawPill({
  layoutId,
  className,
}: {
  layoutId?: string;
  className?: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={DRAW_MORPH_TRANSITION}
      className={cn(
        "flex items-center justify-center rounded-full bg-white px-5 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <span className="text-sm font-bold text-[#10111f]">مساوی</span>
    </motion.div>
  );
}

function DrawCenterBadge({
  layoutId,
  reduceMotion,
}: {
  layoutId?: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.2 }}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <DrawPill layoutId={layoutId} />
    </motion.div>
  );
}

function VsCenterBadge({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: FLAG_EASE }}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-white/45 ring-1 ring-white/12 backdrop-blur-[2px]">
        VS
      </span>
    </motion.div>
  );
}

type FlagLayoutMode = "idle" | "align" | "hero" | "draw";
type FlagSide = "home" | "away";

function flagsGridClass(mode: FlagLayoutMode) {
  switch (mode) {
    case "align":
      return "grid-cols-2 gap-1.5 p-1.5";
    case "hero":
      return "grid-cols-[minmax(0,0.82fr)_minmax(0,1.36fr)_minmax(0,0.82fr)]";
    default:
      return "grid-cols-2";
  }
}

function flagCellClass(
  side: FlagSide,
  mode: FlagLayoutMode,
  selectedSide: FlagSide | null
) {
  if (mode !== "hero" || !selectedSide) return undefined;
  if (selectedSide === "home") {
    return side === "home" ? "col-start-2" : "col-start-3";
  }
  return side === "away" ? "col-start-2" : "col-start-1";
}

function useFlagLayoutMode(
  hasTeamPick: boolean,
  drawSelected: boolean,
  homeSelected: boolean,
  awaySelected: boolean,
  reduceMotion: boolean
): FlagLayoutMode {
  const [mode, setMode] = useState<FlagLayoutMode>("idle");
  const skipAlign = useRef(true);
  const generation = useRef(0);

  useEffect(() => {
    if (skipAlign.current) {
      skipAlign.current = false;
      if (drawSelected) setMode("draw");
      else if (hasTeamPick) setMode("hero");
      else setMode("idle");
      return;
    }

    if (reduceMotion) {
      setMode(drawSelected ? "draw" : hasTeamPick ? "hero" : "idle");
      return;
    }

    if (drawSelected) {
      setMode("draw");
      return;
    }

    if (!hasTeamPick) {
      setMode("idle");
      return;
    }

    const gen = ++generation.current;
    setMode("align");
    const timer = window.setTimeout(() => {
      if (generation.current === gen) setMode("hero");
    }, FLAG_ALIGN_MS);
    return () => window.clearTimeout(timer);
  }, [hasTeamPick, drawSelected, homeSelected, awaySelected, reduceMotion]);

  return mode;
}

function FlagPane({
  team,
  side,
  mode,
  selectedSide,
  drawSelected,
  reduceMotion,
}: {
  team: TeamInfo;
  side: FlagSide;
  mode: FlagLayoutMode;
  selectedSide: FlagSide | null;
  drawSelected: boolean;
  reduceMotion: boolean;
}) {
  const isSelected = selectedSide === side;
  const dimmed = (mode === "hero" && !!selectedSide && !isSelected) || drawSelected;
  const rounded = mode === "align" || (mode === "hero" && isSelected);

  return (
    <motion.div
      layout
      transition={
        reduceMotion
          ? { duration: 0.12 }
          : { layout: FLAG_LAYOUT_SPRING, opacity: { duration: 0.28, ease: FLAG_EASE } }
      }
      animate={{ opacity: dimmed ? 0.52 : 1 }}
      className={cn(
        "relative min-h-0 min-w-0 overflow-hidden",
        flagCellClass(side, mode, selectedSide),
        rounded && FLAG_INNER_RADIUS
      )}
    >
      <PureFlag team={team} />
      {drawSelected && <ShadowOverlay className="z-[2] bg-black/55" />}
      {dimmed && !drawSelected && (
        <ShadowOverlay className="z-[2] bg-black/72 shadow-[inset_0_0_24px_rgba(0,0,0,0.45)]" />
      )}
    </motion.div>
  );
}

function FlagClickZone({
  side,
  label,
  selected,
  onSelect,
  reduceMotion,
}: {
  side: "home" | "away";
  label: string;
  selected: boolean;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      className={cn(
        "absolute inset-y-0 z-30 w-1/2 bg-transparent",
        side === "home" ? "right-0" : "left-0"
      )}
      aria-label={label}
      aria-pressed={selected}
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

function FlagsPickArea({
  match,
  homeSelected,
  awaySelected,
  drawSelected,
  hasTeamPick,
  onSelect,
  reduceMotion,
  drawLayoutId,
  tourTargets,
}: {
  match: MatchData;
  homeSelected: boolean;
  awaySelected: boolean;
  drawSelected: boolean;
  hasTeamPick: boolean;
  onSelect: (choice: PredictionChoice) => void;
  reduceMotion: boolean;
  drawLayoutId?: string;
  tourTargets?: boolean;
}) {
  const selectedSide: FlagSide | null = homeSelected
    ? "home"
    : awaySelected
      ? "away"
      : null;

  const layoutMode = useFlagLayoutMode(
    hasTeamPick,
    drawSelected,
    homeSelected,
    awaySelected,
    reduceMotion
  );

  return (
    <div
      className={cn(FLAGS_BOX_CLASS, FLAGS_BOX_LAYOUT, "relative h-[96px] rounded-2xl")}
      data-tour={tourTargets ? "match-flags" : undefined}
    >
      <FlagClickZone
        side="home"
        label={match.homeTeam.nameFa}
        selected={homeSelected}
        onSelect={() => onSelect(PredictionChoice.HOME_WIN)}
        reduceMotion={reduceMotion}
      />
      <FlagClickZone
        side="away"
        label={match.awayTeam.nameFa}
        selected={awaySelected}
        onSelect={() => onSelect(PredictionChoice.AWAY_WIN)}
        reduceMotion={reduceMotion}
      />

      <motion.div
        layout
        transition={reduceMotion ? { duration: 0.12 } : { layout: FLAG_LAYOUT_SPRING }}
        className={cn("grid h-full", flagsGridClass(layoutMode))}
      >
        <FlagPane
          side="home"
          team={match.homeTeam}
          mode={layoutMode}
          selectedSide={selectedSide}
          drawSelected={drawSelected}
          reduceMotion={reduceMotion}
        />
        <FlagPane
          side="away"
          team={match.awayTeam}
          mode={layoutMode}
          selectedSide={selectedSide}
          drawSelected={drawSelected}
          reduceMotion={reduceMotion}
        />
      </motion.div>

      <AnimatePresence>
        {!hasTeamPick && !drawSelected && (
          <VsCenterBadge key="vs-badge" reduceMotion={reduceMotion} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {drawSelected && (
          <DrawCenterBadge
            key="draw-badge"
            layoutId={drawLayoutId}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamNameStrip({
  name,
  flex,
  selected,
  drawSelected,
  hasTeamPick,
  onSelect,
  reduceMotion,
}: {
  name: string;
  flex: number;
  selected: boolean;
  drawSelected: boolean;
  hasTeamPick: boolean;
  onSelect?: () => void;
  reduceMotion?: boolean;
}) {
  const className = cn(
    "min-w-0 truncate border-t border-white/10 px-1 py-1.5 text-center text-[10px] font-medium leading-tight",
    NAME_STRIP_H,
    selected && !drawSelected ? "text-primary" : "text-white/75",
    drawSelected && "text-white/50",
    hasTeamPick && !selected && !drawSelected && "text-white/40",
    onSelect && "cursor-pointer hover:text-white/90"
  );

  if (onSelect) {
    return (
      <motion.button
        type="button"
        layout
        onClick={onSelect}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        animate={{ flex }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className={className}
        aria-label={name}
        aria-pressed={selected}
      >
        {name}
      </motion.button>
    );
  }

  return (
    <motion.span
      layout
      animate={{ flex }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className={className}
    >
      {name}
    </motion.span>
  );
}

function ConfirmedCard({
  match,
  selected,
  reduceMotion,
}: {
  match: MatchData;
  selected: PredictionChoice;
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
      className="relative w-full overflow-hidden rounded-2xl glass-panel"
    >
      {isDraw ? (
        <div className="relative">
          <FlagsBox className="relative flex h-[96px] overflow-hidden rounded-2xl">
            <div className="relative h-full min-w-0 flex-1 overflow-hidden">
              <PureFlag team={match.homeTeam} />
              <ShadowOverlay className="bg-black/55" />
            </div>
            <div className="relative h-full min-w-0 flex-1 overflow-hidden">
              <PureFlag team={match.awayTeam} />
              <ShadowOverlay className="bg-black/55" />
            </div>
            <DrawCenterBadge reduceMotion={!!reduceMotion} />
          </FlagsBox>
          <div className={cn("flex glass-surface rounded-b-2xl", FLAGS_BOX_LAYOUT)}>
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
        <div className="relative overflow-hidden rounded-2xl pt-3">
          <FlagGhostBackdrop team={winTeam} cardLevel />
          <div className="relative z-[1]">
            <FlagsBox className="relative h-[96px] overflow-hidden rounded-2xl">
              <PureFlag team={winTeam} />
            </FlagsBox>
            <span
              className={cn(
                "mx-auto mt-2 block truncate border-t border-white/10 px-2 py-1.5 text-center text-[10px] font-medium text-primary glass-surface rounded-b-2xl",
                NAME_STRIP_H,
                FLAGS_BOX_LAYOUT
              )}
            >
              {winTeam.nameFa}
            </span>
          </div>
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
  tourTargets = false,
}: Props) {
  const reduceMotion = useReducedMotion();

  const homeSelected = selected === PredictionChoice.HOME_WIN;
  const awaySelected = selected === PredictionChoice.AWAY_WIN;
  const drawSelected = selected === PredictionChoice.DRAW;
  const hasTeamPick = homeSelected || awaySelected;
  const showConfirmed = (confirmed || locked) && submitted && selected;

  const homeNameFlex = hasTeamPick
    ? homeSelected
      ? SELECTED_FLAG_FLEX
      : UNSELECTED_FLAG_FLEX
    : 1;
  const awayNameFlex = hasTeamPick
    ? awaySelected
      ? SELECTED_FLAG_FLEX
      : UNSELECTED_FLAG_FLEX
    : 1;
  const drawLayoutId = reduceMotion ? undefined : `draw-pill-${match.id}`;
  const selectedTeam = homeSelected
    ? match.homeTeam
    : awaySelected
      ? match.awayTeam
      : null;

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
            reduceMotion={!!reduceMotion}
          />
        ) : (
          <motion.div
            key="selecting"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "overflow-hidden rounded-2xl glass-panel",
              drawSelected && "ring-1 ring-primary/50"
            )}
          >
            <LayoutGroup id={`match-draw-${match.id}`}>
            <div className="relative pt-3">
            <AnimatePresence>
              {selectedTeam && (
                <FlagGhostBackdrop key={selectedTeam.code} team={selectedTeam} cardLevel />
              )}
            </AnimatePresence>
            <div className="relative z-[1]">
            <FlagsPickArea
              match={match}
              homeSelected={homeSelected}
              awaySelected={awaySelected}
              drawSelected={drawSelected}
              hasTeamPick={hasTeamPick}
              onSelect={onSelect}
              reduceMotion={!!reduceMotion}
              drawLayoutId={drawLayoutId}
              tourTargets={tourTargets}
            />
            <div className={cn("mt-2 flex glass-surface rounded-2xl", FLAGS_BOX_LAYOUT)}>
              <TeamNameStrip
                name={match.homeTeam.nameFa}
                flex={homeNameFlex}
                selected={homeSelected}
                drawSelected={drawSelected}
                hasTeamPick={hasTeamPick}
                onSelect={() => onSelect(PredictionChoice.HOME_WIN)}
                reduceMotion={!!reduceMotion}
              />
              <TeamNameStrip
                name={match.awayTeam.nameFa}
                flex={awayNameFlex}
                selected={awaySelected}
                drawSelected={drawSelected}
                hasTeamPick={hasTeamPick}
                onSelect={() => onSelect(PredictionChoice.AWAY_WIN)}
                reduceMotion={!!reduceMotion}
              />
            </div>

            <motion.div
              layout
              transition={DRAW_MORPH_TRANSITION}
              className={cn("mt-2", FLAGS_BOX_LAYOUT)}
            >
              <MatchMetaRow startTime={match.startTime} tourTarget={tourTargets} />
            </motion.div>
            </div>
            </div>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
