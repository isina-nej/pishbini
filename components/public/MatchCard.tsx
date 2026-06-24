"use client";

import type { ReactNode } from "react";
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

function PureFlag({ team }: { team: TeamInfo }) {
  return <TeamFlag code={team.code} alt={team.nameFa} fill fit="stretch" />;
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
  reduceMotion,
}: {
  team: TeamInfo;
  selected: boolean;
  hasTeamPick: boolean;
  drawSelected: boolean;
  onSelect: () => void;
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
        flex: hasTeamPick ? (selected ? SELECTED_FLAG_FLEX : UNSELECTED_FLAG_FLEX) : 1,
      }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="relative h-full min-w-0 overflow-hidden"
      aria-label={team.nameFa}
    >
      <PureFlag team={team} />
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
          <FlagsBox className="flex h-[96px] rounded-t-2xl">
            <div className="relative min-w-0 flex-1 overflow-hidden">
              <PureFlag team={match.homeTeam} />
              <ShadowOverlay className="bg-black/55" />
            </div>
            <div className="relative min-w-0 flex-1 overflow-hidden">
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
        <div className="relative">
          <FlagsBox className="h-[96px] rounded-t-2xl">
            <PureFlag team={winTeam} />
          </FlagsBox>
          <span
            className={cn(
              "block truncate border-t border-white/10 px-2 py-1.5 text-center text-[10px] font-medium text-primary glass-surface rounded-b-2xl",
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
            <div className="pt-3">
            <FlagsBox
              className="flex h-[96px] rounded-t-2xl"
              data-tour={tourTargets ? "match-flags" : undefined}
            >
              <SelectableFlag
                team={match.homeTeam}
                selected={homeSelected}
                hasTeamPick={hasTeamPick}
                drawSelected={drawSelected}
                onSelect={() => onSelect(PredictionChoice.HOME_WIN)}
                reduceMotion={!!reduceMotion}
              />
              <SelectableFlag
                team={match.awayTeam}
                selected={awaySelected}
                hasTeamPick={hasTeamPick}
                drawSelected={drawSelected}
                onSelect={() => onSelect(PredictionChoice.AWAY_WIN)}
                reduceMotion={!!reduceMotion}
              />
              <AnimatePresence>
                {drawSelected && (
                  <DrawCenterBadge
                    key="draw-badge"
                    layoutId={drawLayoutId}
                    reduceMotion={!!reduceMotion}
                  />
                )}
              </AnimatePresence>
            </FlagsBox>
            <div className={cn("mt-2 flex glass-surface rounded-2xl", FLAGS_BOX_LAYOUT)}>
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

            <AnimatePresence mode="popLayout" initial={false}>
              {!drawSelected && (
                <motion.button
                  key="draw-button"
                  layout
                  type="button"
                  data-tour={tourTargets ? "match-draw" : undefined}
                  onClick={() => onSelect(PredictionChoice.DRAW)}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  className={cn(
                    FLAGS_BOX_LAYOUT,
                    "mt-2 flex h-11 items-center justify-center rounded-2xl text-sm font-bold text-white/90 transition-shadow glass-pill hover:bg-white/[0.12]"
                  )}
                >
                  {drawLayoutId ? (
                    <motion.div
                      layoutId={drawLayoutId}
                      transition={DRAW_MORPH_TRANSITION}
                      className="flex h-full w-full items-center justify-center rounded-2xl"
                    >
                      مساوی
                    </motion.div>
                  ) : (
                    <span>مساوی</span>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={DRAW_MORPH_TRANSITION}
              className={cn("mt-2", FLAGS_BOX_LAYOUT)}
            >
              <MatchMetaRow startTime={match.startTime} tourTarget={tourTargets} />
            </motion.div>
            </div>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
