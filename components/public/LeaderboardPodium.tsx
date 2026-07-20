"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LeaderboardUser } from "./LeaderboardCard";
import { Crown, Medal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PODIUM = {
  1: {
    height: "h-28",
    medal: "from-amber-200 via-yellow-300 to-amber-500",
    ring: "ring-amber-300/70",
    glow: "shadow-[0_0_32px_rgba(255,215,0,0.42)]",
    label: "قهرمان ایونت",
    pillar: "from-amber-300/40 via-yellow-300/18 to-white/5",
    score: "text-amber-300",
  },
  2: {
    height: "h-20",
    medal: "from-slate-200 via-zinc-100 to-slate-400",
    ring: "ring-slate-200/55",
    glow: "shadow-[0_0_18px_rgba(192,192,192,0.3)]",
    label: "نایب‌قهرمان",
    pillar: "from-slate-200/28 via-slate-300/12 to-white/5",
    score: "text-slate-200",
  },
  3: {
    height: "h-16",
    medal: "from-orange-300 via-amber-500 to-orange-700",
    ring: "ring-orange-300/55",
    glow: "shadow-[0_0_18px_rgba(205,127,50,0.34)]",
    label: "سوم برتر",
    pillar: "from-orange-300/28 via-amber-600/12 to-white/5",
    score: "text-orange-300",
  },
} as const;

const CONFETTI = [
  { left: "6%", top: "8%", color: "bg-amber-300", rotate: -28, drift: -18, delay: 0.1, duration: 3.6 },
  { left: "14%", top: "3%", color: "bg-primary", rotate: 18, drift: 12, delay: 0.25, duration: 3.1 },
  { left: "22%", top: "14%", color: "bg-rose-400", rotate: -14, drift: -10, delay: 0.5, duration: 3.9 },
  { left: "31%", top: "6%", color: "bg-secondary", rotate: 24, drift: 18, delay: 0.35, duration: 3.4 },
  { left: "42%", top: "1%", color: "bg-yellow-300", rotate: -20, drift: 8, delay: 0.15, duration: 3.2 },
  { left: "52%", top: "10%", color: "bg-white", rotate: 32, drift: -16, delay: 0.45, duration: 3.7 },
  { left: "63%", top: "2%", color: "bg-emerald-300", rotate: -16, drift: 14, delay: 0.3, duration: 3.25 },
  { left: "74%", top: "11%", color: "bg-orange-300", rotate: 14, drift: -12, delay: 0.6, duration: 3.8 },
  { left: "82%", top: "4%", color: "bg-sky-300", rotate: -36, drift: 10, delay: 0.2, duration: 3.15 },
  { left: "92%", top: "7%", color: "bg-pink-300", rotate: 22, drift: -8, delay: 0.55, duration: 3.55 },
] as const;

const FOOTBALLS = [
  { left: "8%", top: "54%", size: "text-xl", delay: 0.15, duration: 5.6, x: -10 },
  { left: "79%", top: "42%", size: "text-2xl", delay: 0.5, duration: 6.2, x: 14 },
  { left: "45%", top: "18%", size: "text-lg", delay: 0.25, duration: 5.2, x: -6 },
] as const;

function ConfettiRain({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CONFETTI.map((piece, i) => (
        <motion.span
          key={`${piece.left}-${i}`}
          className={cn("absolute block h-6 w-1 rounded-full opacity-80", piece.color)}
          style={{ left: piece.left, top: piece.top }}
          initial={{ opacity: 0, y: -12, x: 0, rotate: piece.rotate, scale: 0.85 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, 42, 96, 132],
            x: [0, piece.drift, piece.drift * -0.35, piece.drift * 0.2],
            rotate: [piece.rotate, piece.rotate + 100, piece.rotate + 220],
            scale: [0.8, 1, 0.92],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            repeat: Infinity,
            repeatDelay: 0.45,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function StadiumLights({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-20 left-1/2 h-48 w-56 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl"
        animate={reduceMotion ? { opacity: 0.35 } : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-10 top-10 h-36 w-24 rotate-[22deg] rounded-full bg-sky-400/12 blur-2xl"
        animate={reduceMotion ? { opacity: 0.25 } : { opacity: [0.2, 0.45, 0.2], x: [0, 10, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-10 top-12 h-36 w-24 -rotate-[22deg] rounded-full bg-primary/15 blur-2xl"
        animate={reduceMotion ? { opacity: 0.25 } : { opacity: [0.2, 0.5, 0.2], x: [0, -10, 0] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_at_bottom,rgba(20,224,189,0.16),transparent_58%)]" />
    </div>
  );
}

function FloatingFootball({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {FOOTBALLS.map((ball, i) => (
        <motion.span
          key={`${ball.left}-${i}`}
          className={cn("absolute select-none opacity-20 drop-shadow-[0_0_10px_rgba(255,255,255,0.16)]", ball.size)}
          style={{ left: ball.left, top: ball.top }}
          initial={{ opacity: 0, y: 10, rotate: 0 }}
          animate={{
            opacity: [0.08, 0.22, 0.08],
            y: [0, -14, 0],
            x: [0, ball.x, 0],
            rotate: [0, 12, -10, 0],
          }}
          transition={{ duration: ball.duration, delay: ball.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          ⚽
        </motion.span>
      ))}
    </div>
  );
}

function PodiumSlot({
  user,
  place,
  reduceMotion,
}: {
  user: LeaderboardUser;
  place: 1 | 2 | 3;
  reduceMotion: boolean;
}) {
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
      <motion.div
        className={cn(
          "relative mb-2 flex items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-[#10111f] ring-2",
          style.medal,
          style.ring,
          style.glow,
          place === 1 ? "size-16" : "size-14"
        )}
        animate={
          reduceMotion
            ? undefined
            : place === 1
              ? { scale: [1, 1.08, 1], y: [0, -4, 0], rotate: [0, 1.5, 0] }
              : { y: [0, -2, 0] }
        }
        transition={{ duration: place === 1 ? 2.8 : 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {place === 1 ? <Crown className="size-7" /> : <span>{initials}</span>}
        {place === 1 && !reduceMotion && (
          <motion.span
            className="absolute -right-1 -top-1 text-amber-100"
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.45, 1, 0.45], rotate: [0, 12, -8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="size-4" />
          </motion.span>
        )}
        <span
          className={cn(
            "absolute -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-[#10111f] text-[10px] font-bold ring-1",
            place === 1
              ? "text-amber-400 ring-amber-400/50"
              : place === 2
                ? "text-slate-300 ring-slate-400/40"
                : "text-orange-400 ring-orange-500/40"
          )}
        >
          {place}
        </span>
      </motion.div>

      <motion.p
        className="max-w-[108px] truncate text-center text-xs font-semibold"
        animate={reduceMotion ? undefined : { opacity: [0.88, 1, 0.88] }}
        transition={{ duration: 2.4 + place * 0.25, repeat: Infinity, ease: "easeInOut" }}
      >
        {user.fullName}
      </motion.p>
      <p className={cn("mt-0.5 text-sm font-bold", style.score)}>{user.points.toLocaleString("fa-IR")}</p>
      <p className="text-[10px] text-white/45">{style.label}</p>

      <div className={cn("relative mt-3 w-full overflow-hidden rounded-t-[1.35rem] bg-gradient-to-t", style.height, style.pillar)}>
        <div className="absolute inset-x-3 top-2 h-px bg-white/20" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
        {!reduceMotion && (
          <motion.div
            className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-22deg] bg-white/15 blur-sm"
            animate={{ x: ["-30%", "240%"] }}
            transition={{ duration: 2.8 + place * 0.35, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
          />
        )}
      </div>
    </motion.div>
  );
}

export function LeaderboardPodium({ users }: { users: LeaderboardUser[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  const top3 = users.filter((u) => u.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return null;

  const first = top3.find((u) => u.rank === 1);
  const second = top3.find((u) => u.rank === 2);
  const third = top3.find((u) => u.rank === 3);

  return (
    <div className="relative mx-4 mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,44,0.96),rgba(8,13,28,0.98))] p-4 pt-6 shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
      <StadiumLights reduceMotion={reduceMotion} />
      <FloatingFootball reduceMotion={reduceMotion} />
      <ConfettiRain reduceMotion={reduceMotion} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(67,101,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(20,224,189,0.06))]" />

      <div className="relative mb-4 flex flex-col items-center justify-center gap-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-bold text-amber-200 shadow-[0_0_18px_rgba(255,215,0,0.14)]">
          <Sparkles className="size-3.5" />
          جشن قهرمانان میدان
          <Sparkles className="size-3.5" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Medal className="size-4 text-amber-400" />
          <p className="text-sm font-semibold text-white/85">سکوی برترین‌ها</p>
        </div>
      </div>

      <div className="relative flex items-end justify-center gap-2 px-2">
        {second && <PodiumSlot user={second} place={2} reduceMotion={reduceMotion} />}
        {first && <PodiumSlot user={first} place={1} reduceMotion={reduceMotion} />}
        {third && <PodiumSlot user={third} place={3} reduceMotion={reduceMotion} />}
      </div>
    </div>
  );
}
