"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { TeamFlag } from "@/components/public/TeamFlag";
import { cn } from "@/lib/utils";
import type { BracketTeam } from "@/lib/bracket/types";
import type { ResolvedMatch } from "@/lib/bracket/types";

type Props = {
  match: ResolvedMatch;
  onSelect: (teamId: string) => void;
  index: number;
};

export function BracketMatchCard({ match, onSelect, index }: Props) {
  const reduceMotion = useReducedMotion();

  if (!match.isReady) {
    return (
      <div className="rounded-xl border border-[var(--bracket-border)] bg-[var(--bracket-surface)] p-3 opacity-50">
        <p className="text-center text-xs text-[var(--bracket-text-muted)]">در انتظار تیم‌ها...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.04, duration: 0.22 }}
      className="overflow-hidden rounded-xl border border-[var(--bracket-border)] bg-[var(--bracket-surface-elevated)] shadow-lg"
    >
      <TeamRow
        team={match.homeTeam!}
        slotLabel="میزبان"
        selected={match.winnerTeamId === match.homeTeamId}
        eliminated={Boolean(match.winnerTeamId && match.winnerTeamId !== match.homeTeamId)}
        onSelect={() => onSelect(match.homeTeamId!)}
      />
      <div className="h-px bg-[var(--bracket-border)]" />
      <TeamRow
        team={match.awayTeam!}
        slotLabel="میهمان"
        selected={match.winnerTeamId === match.awayTeamId}
        eliminated={Boolean(match.winnerTeamId && match.winnerTeamId !== match.awayTeamId)}
        onSelect={() => onSelect(match.awayTeamId!)}
      />
    </motion.div>
  );
}

function TeamRow({
  team,
  selected,
  eliminated,
  onSelect,
}: {
  team: BracketTeam;
  slotLabel: string;
  selected: boolean;
  eliminated: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`انتخاب ${team.nameFa} به‌عنوان برنده مسابقه`}
      className={cn(
        "relative flex min-h-[48px] w-full items-center gap-3 px-3 py-2.5 text-right transition-all",
        selected && "bg-[var(--bracket-primary)]/15",
        eliminated && "opacity-40",
        !selected && !eliminated && "hover:bg-white/5"
      )}
    >
      <div className="relative h-8 w-11 shrink-0 overflow-hidden rounded-md">
        <TeamFlag src={team.flagUrl} code={team.code} alt={team.nameFa} fill loading="lazy" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", selected && "text-[var(--bracket-primary)]")}>
          {team.nameFa}
        </p>
        <p className="text-[10px] text-[var(--bracket-text-muted)]">{team.code}</p>
      </div>
      {selected && (
        <Check className="h-4 w-4 shrink-0 text-[var(--bracket-primary)]" aria-hidden />
      )}
    </button>
  );
}
