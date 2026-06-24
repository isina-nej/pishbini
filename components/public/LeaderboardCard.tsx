"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Trophy, UserPlus, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type LeaderboardUser = {
  rank: number;
  fullName: string;
  maskedPhone: string;
  points: number;
  correctPredictions: number;
  wrongPredictions: number;
  referralCount: number;
};

const RANK_STYLES: Record<number, string> = {
  1: "from-amber-400/20 to-amber-600/5 border-amber-400/30",
  2: "from-slate-300/15 to-slate-500/5 border-slate-400/25",
  3: "from-orange-500/15 to-orange-800/5 border-orange-500/25",
};

export function LeaderboardCard({
  user,
  index,
  highlight,
  compact,
}: {
  user: LeaderboardUser;
  index: number;
  highlight?: boolean;
  compact?: boolean;
}) {
  const topStyle = RANK_STYLES[user.rank];
  const isTop = user.rank <= 3 && !compact;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "mx-4 mb-3 overflow-hidden rounded-2xl p-4 glass-panel",
        highlight
          ? "border-primary/40 bg-primary/10 shadow-[0_0_24px_rgba(20,224,189,0.15)]"
          : isTop && topStyle
            ? `bg-gradient-to-l ${topStyle}`
            : ""
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            user.rank === 1 && "bg-gradient-to-br from-amber-300 to-amber-600 text-[#10111f]",
            user.rank === 2 && "bg-gradient-to-br from-slate-200 to-slate-400 text-[#10111f]",
            user.rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-700 text-[#10111f]",
            user.rank > 3 && "bg-white/10 text-white/70"
          )}
        >
          {user.rank <= 3 ? (
            <Trophy className={cn("size-5", user.rank === 1 && "text-amber-900")} />
          ) : (
            user.rank
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold">{user.fullName}</p>
            {highlight && <Sparkles className="size-3.5 shrink-0 text-primary" />}
          </div>
          <p className="text-[11px] text-white/45" dir="ltr">
            {user.maskedPhone}
          </p>
        </div>

        <div className="shrink-0 text-left">
          <p className="flex items-center justify-end gap-1 text-lg font-bold text-primary">
            <Trophy className="size-4 text-amber-400" />
            {user.points.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
          <StatPill
            icon={CheckCircle2}
            value={user.correctPredictions}
            label="درست"
            className="text-success bg-success/10"
            iconClass="text-success"
          />
          <StatPill
            icon={XCircle}
            value={user.wrongPredictions}
            label="غلط"
            className="text-danger bg-danger/10"
            iconClass="text-danger"
          />
          <StatPill
            icon={UserPlus}
            value={user.referralCount}
            label="دعوت"
            className="text-secondary bg-secondary/10"
            iconClass="text-secondary"
          />
        </div>
      )}
    </motion.div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  className,
  iconClass,
}: {
  icon: typeof CheckCircle2;
  value: number;
  label: string;
  className: string;
  iconClass: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium",
        className
      )}
    >
      <Icon className={cn("size-3.5", iconClass)} />
      <span>{value.toLocaleString("fa-IR")}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}
