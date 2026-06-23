"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, Trophy } from "lucide-react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { TourPageReady } from "@/components/public/TourPageReady";
import { ErrorState } from "@/components/public/ErrorState";
import { LeaderboardCard, type LeaderboardUser } from "@/components/public/LeaderboardCard";
import { LeaderboardPodium } from "@/components/public/LeaderboardPodium";
import { LoadingState } from "@/components/public/LoadingState";

const PUBLIC_LEADERBOARD_LIMIT = 10;

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUsers((data.users ?? []).slice(0, PUBLIC_LEADERBOARD_LIMIT));
      })
      .catch(() => setError("خطا در دریافت جدول امتیازات"))
      .finally(() => setLoading(false));
  }, []);

  const rest = users.filter((u) => u.rank > 3 && u.rank <= PUBLIC_LEADERBOARD_LIMIT);

  return (
    <PublicPageShell pageId="leaderboard" tourReady={!loading && !error}>
      <TourPageReady ready={!loading && !error} />
      <div className="pb-24 pt-4">
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
              رقابت زنده — امتیاز، پیش‌بینی درست و دعوت‌های موفق
            </p>
            <Link
              href="/prizes"
              data-tour="leaderboard-prizes-link"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary"
            >
              <Gift className="size-3.5" />
              جوایز و قوانین امتیازدهی
            </Link>
          </div>
        </motion.header>

        {!loading && users.length > 0 && (
          <div className="mx-4 mb-4 flex justify-center" data-tour="leaderboard-top-score">
            <MiniStat
              icon={Trophy}
              label="بیشترین امتیاز"
              value={users[0]?.points ?? 0}
              color="text-amber-400"
            />
          </div>
        )}

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {!loading && !error && users.length > 0 && (
          <div data-tour="leaderboard-podium">
            <LeaderboardPodium users={users} />
          </div>
        )}

        {!loading &&
          rest.length > 0 && (
            <div data-tour="leaderboard-list">
              <p className="mb-2 px-4 text-xs font-medium text-white/40">رتبه‌های ۴ تا ۱۰</p>
              {rest.map((user, i) => (
                <LeaderboardCard key={`${user.rank}-${user.maskedPhone}`} user={user} index={i} />
              ))}
            </div>
          )}

        {!loading && users.length === 0 && !error && (
          <p className="px-4 py-12 text-center text-sm text-white/45">هنوز کسی در جدول نیست</p>
        )}
      </div>
    </PublicPageShell>
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
