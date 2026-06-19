"use client";

import { motion } from "framer-motion";

export type LeaderboardUser = {
  rank: number;
  fullName: string;
  maskedPhone: string;
  points: number;
  correctPredictions: number;
};

export function LeaderboardCard({
  user,
  index,
  highlight,
}: {
  user: LeaderboardUser;
  index: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card mx-4 mb-3 flex items-center gap-3 p-4 ${
        highlight ? "border-primary/50 glow-selected" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          user.rank <= 3
            ? "bg-gradient-to-br from-primary to-secondary text-[#10111f]"
            : "bg-white/10"
        }`}
      >
        {user.rank}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{user.fullName}</p>
        <p className="text-xs text-white/50" dir="ltr">
          {user.maskedPhone}
        </p>
      </div>
      <div className="text-left">
        <p className="font-bold text-primary">{user.points.toLocaleString("fa-IR")}</p>
        <p className="text-xs text-white/50">
          {user.correctPredictions} درست
        </p>
      </div>
    </motion.div>
  );
}
