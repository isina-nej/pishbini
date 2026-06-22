"use client";

import { motion } from "framer-motion";
import type { LeaderboardUser } from "./LeaderboardCard";
import { Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const PODIUM = {
  1: {
    height: "h-28",
    medal: "from-amber-300 via-yellow-400 to-amber-600",
    ring: "ring-amber-400/50",
    glow: "shadow-[0_0_24px_rgba(255,215,0,0.35)]",
    label: "نفر اول",
  },
  2: {
    height: "h-20",
    medal: "from-slate-300 via-gray-200 to-slate-400",
    ring: "ring-slate-300/40",
    glow: "shadow-[0_0_16px_rgba(192,192,192,0.25)]",
    label: "نفر دوم",
  },
  3: {
    height: "h-16",
    medal: "from-orange-400 via-amber-700 to-orange-900",
    ring: "ring-orange-500/40",
    glow: "shadow-[0_0_16px_rgba(205,127,50,0.3)]",
    label: "نفر سوم",
  },
} as const;

function PodiumSlot({ user, place }: { user: LeaderboardUser; place: 1 | 2 | 3 }) {
  const style = PODIUM[place];
  const initials = user.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: place === 1 ? 0.15 : place === 2 ? 0.05 : 0.25, type: "spring" }}
      className={cn("flex flex-1 flex-col items-center", place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3")}
    >
      <div
        className={cn(
          "relative mb-2 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-[#10111f] ring-2",
          style.medal,
          style.ring,
          style.glow,
          place === 1 && "size-16"
        )}
      >
        {place === 1 ? <Crown className="size-7" /> : <span>{initials}</span>}
        <span
          className={cn(
            "absolute -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-[#10111f] text-[10px] font-bold ring-1",
            place === 1 ? "text-amber-400 ring-amber-400/50" : place === 2 ? "text-slate-300 ring-slate-400/40" : "text-orange-400 ring-orange-500/40"
          )}
        >
          {place}
        </span>
      </div>
      <p className="max-w-[100px] truncate text-center text-xs font-semibold">{user.fullName}</p>
      <p className="mt-0.5 text-sm font-bold text-primary">{user.points.toLocaleString("fa-IR")}</p>
      <p className="text-[10px] text-white/40">{style.label}</p>
      <div
        className={cn(
          "mt-3 w-full rounded-t-2xl bg-gradient-to-t from-white/10 to-white/5",
          style.height
        )}
      />
    </motion.div>
  );
}

export function LeaderboardPodium({ users }: { users: LeaderboardUser[] }) {
  const top3 = users.filter((u) => u.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return null;

  const first = top3.find((u) => u.rank === 1);
  const second = top3.find((u) => u.rank === 2);
  const third = top3.find((u) => u.rank === 3);

  return (
    <div className="relative mx-4 mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-secondary/15 via-transparent to-primary/5 p-4 pt-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(67,101,255,0.2),transparent_60%)]" />
      <div className="relative mb-4 flex items-center justify-center gap-2">
        <Medal className="size-4 text-amber-400" />
        <p className="text-sm font-semibold text-white/80">سکوی برترین‌ها</p>
      </div>
      <div className="relative flex items-end justify-center gap-2 px-2">
        {second && <PodiumSlot user={second} place={2} />}
        {first && <PodiumSlot user={first} place={1} />}
        {third && <PodiumSlot user={third} place={3} />}
      </div>
    </div>
  );
}
