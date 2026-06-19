"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/public/BottomNav";
import { ErrorState } from "@/components/public/ErrorState";
import { LeaderboardCard, type LeaderboardUser } from "@/components/public/LeaderboardCard";
import { LoadingState } from "@/components/public/LoadingState";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUsers(data.users ?? []);
        setCurrentUser(data.currentUser ?? null);
      })
      .catch(() => setError("خطا در دریافت جدول امتیازات"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24 pt-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 px-4 text-center"
      >
        <h1 className="text-2xl font-bold">جدول امتیازات</h1>
        <p className="mt-2 text-xs text-white/50">
          در پایان کمپین، جایزه به شرکت‌کننده‌ای تعلق می‌گیرد که بیشترین امتیاز را داشته باشد.
        </p>
      </motion.header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {currentUser && !loading && (
        <div className="mb-4">
          <p className="mb-2 px-4 text-sm text-primary">رتبه شما</p>
          <LeaderboardCard user={currentUser} index={0} highlight />
        </div>
      )}

      {!loading &&
        users.map((user, i) => (
          <LeaderboardCard key={`${user.rank}-${user.maskedPhone}`} user={user} index={i} />
        ))}

      <BottomNav />
    </div>
  );
}
