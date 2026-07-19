"use client";

import { motion } from "framer-motion";
import { Gift, Trophy } from "lucide-react";
import { ErrorState } from "@/components/public/ErrorState";
import { LeaderboardCard, type LeaderboardUser } from "@/components/public/LeaderboardCard";
import { LeaderboardPodium } from "@/components/public/LeaderboardPodium";
import { LoadingState } from "@/components/public/LoadingState";
import { useTabData } from "@/hooks/useTabData";
import { useTabNavigate } from "@/hooks/useTabNavigate";
import { useSetTabPageMeta } from "@/lib/tab-page-meta";

const PUBLIC_LEADERBOARD_LIMIT = 10;

async function fetchLeaderboard(): Promise<LeaderboardUser[]> {
  const res = await fetch("/api/leaderboard");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.users ?? []).slice(0, PUBLIC_LEADERBOARD_LIMIT);
}

export default function LeaderboardPage() {
  const { navigateToTab } = useTabNavigate();
  const { data: users = [], error, isInitialLoad } = useTabData("leaderboard", fetchLeaderboard);

  useSetTabPageMeta({ tourReady: !isInitialLoad && !error });

  const rest = users.filter((u) => u.rank > 3 && u.rank <= PUBLIC_LEADERBOARD_LIMIT);

  return (
    <div className="pb-32 pt-4">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-2 px-4 text-center"
        data-tour="leaderboard-header"
      >
        <div className="pointer-events-none absolute inset-x-4 top-0 h-24 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-secondary/20 ring-1 ring-white/10">
            <Trophy className="size-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">جدول امتیازات</h1>
          <p className="mt-2 text-xs text-white/50">
            برترین‌های نهایی ایونت — امتیاز، پیش‌بینی درست و دعوت‌های موفق
          </p>
          <button
            type="button"
            data-tour="leaderboard-prizes-link"
            onClick={() => navigateToTab("prizes")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary"
          >
            <Gift className="size-3.5" />
            جوایز و قوانین پایان ایونت
          </button>
        </div>
      </motion.header>

      {!isInitialLoad && users.length > 0 && (
        <div className="mx-4 mb-4 flex justify-center" data-tour="leaderboard-top-score">
          <MiniStat
            icon={Trophy}
            label="بیشترین امتیاز"
            value={users[0]?.points ?? 0}
            color="text-amber-400"
          />
        </div>
      )}

      {isInitialLoad && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!isInitialLoad && !error && users.length > 0 && (
        <div data-tour="leaderboard-podium">
          <LeaderboardPodium users={users} />
        </div>
      )}

      {!isInitialLoad &&
        rest.length > 0 && (
          <div data-tour="leaderboard-list">
            <p className="mb-2 px-4 text-xs font-medium text-white/40">رتبه‌های ۴ تا ۱۰</p>
            {rest.map((user, i) => (
              <LeaderboardCard key={`${user.rank}-${user.maskedPhone}`} user={user} index={i} />
            ))}
          </div>
        )}

      {!isInitialLoad && users.length === 0 && !error && (
        <p className="px-4 py-12 text-center text-sm text-white/45">هنوز کسی در جدول نیست</p>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Trophy;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2">
      <p className={`flex items-center justify-center gap-1 text-sm font-bold ${color}`}>
        <Icon className="size-3.5" />
        {value.toLocaleString("fa-IR")}
      </p>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  );
}
