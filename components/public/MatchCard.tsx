"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PredictionChoice } from "@/generated/prisma";
import { formatPersianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type MatchData = {
  id: string;
  homeTeam: { nameFa: string; code: string; flagUrl: string };
  awayTeam: { nameFa: string; code: string; flagUrl: string };
  startTime: string;
};

type Props = {
  match: MatchData;
  selected?: PredictionChoice | null;
  onSelect: (choice: PredictionChoice) => void;
  index: number;
};

export function MatchCard({ match, selected, onSelect, index }: Props) {
  const options: { choice: PredictionChoice; label: string; zone: "home" | "draw" | "away" }[] = [
    { choice: PredictionChoice.HOME_WIN, label: match.homeTeam.nameFa, zone: "home" },
    { choice: PredictionChoice.DRAW, label: "مساوی", zone: "draw" },
    { choice: PredictionChoice.AWAY_WIN, label: match.awayTeam.nameFa, zone: "away" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card mx-4 mb-4 overflow-hidden p-4"
    >
      <p className="mb-4 text-center text-xs text-white/65">
        {formatPersianDateTime(match.startTime)}
      </p>

      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(PredictionChoice.HOME_WIN)}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl p-2 transition-all",
            selected === PredictionChoice.HOME_WIN && "glow-selected scale-105 bg-primary/10"
          )}
        >
          <div className="relative h-12 w-16 overflow-hidden rounded-lg">
            <Image src={match.homeTeam.flagUrl} alt={match.homeTeam.nameFa} fill className="object-cover" />
          </div>
          <span className="text-sm font-medium">{match.homeTeam.nameFa}</span>
          <span className="text-xs text-white/50">{match.homeTeam.code}</span>
        </button>

        <span className="text-xs font-bold text-white/40">VS</span>

        <button
          type="button"
          onClick={() => onSelect(PredictionChoice.AWAY_WIN)}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl p-2 transition-all",
            selected === PredictionChoice.AWAY_WIN && "glow-selected scale-105 bg-primary/10"
          )}
        >
          <div className="relative h-12 w-16 overflow-hidden rounded-lg">
            <Image src={match.awayTeam.flagUrl} alt={match.awayTeam.nameFa} fill className="object-cover" />
          </div>
          <span className="text-sm font-medium">{match.awayTeam.nameFa}</span>
          <span className="text-xs text-white/50">{match.awayTeam.code}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.choice}
            type="button"
            onClick={() => onSelect(opt.choice)}
            className={cn(
              "rounded-xl border border-white/10 py-2.5 text-xs font-medium transition-all",
              selected === opt.choice
                ? "glow-selected pulse-soft border-primary bg-gradient-to-b from-primary/20 to-secondary/20 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            {opt.zone === "draw" ? "مساوی" : opt.zone === "home" ? "برد میزبان" : "برد میهمان"}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
