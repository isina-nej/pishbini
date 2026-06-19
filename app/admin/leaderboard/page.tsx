"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type Entry = {
  rank: number;
  fullName: string;
  maskedPhone: string;
  points: number;
  correctPredictions: number;
  userId: string;
};

export default function AdminLeaderboardPage() {
  const [users, setUsers] = useState<Entry[]>([]);
  const [frozen, setFrozen] = useState(false);
  const [winnerId, setWinnerId] = useState("");

  const load = () =>
    fetch("/api/admin/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setFrozen(d.campaignFrozen ?? false);
        setWinnerId(d.prizeWinnerUserId ?? "");
      });

  useEffect(() => {
    load();
  }, []);

  const handleFreeze = async () => {
    if (!confirm(frozen ? "لغو فریز کمپین؟" : "فریز کردن کمپین؟")) return;
    await fetch("/api/admin/campaign/freeze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frozen: !frozen }),
    });
    load();
  };

  const handleMarkWinner = async () => {
    if (!winnerId) return alert("شناسه کاربر را وارد کنید");
    await fetch("/api/admin/campaign/freeze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: winnerId }),
    });
    alert("برنده ثبت شد");
    load();
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">جدول امتیازات</h1>
        <a href="/api/admin/leaderboard/export" className="rounded-lg bg-secondary px-4 py-2 text-sm">
          خروجی CSV
        </a>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleFreeze}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${frozen ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"}`}
        >
          {frozen ? "کمپین فریز شده — لغو فریز" : "فریز کمپین"}
        </button>
        <input
          value={winnerId}
          onChange={(e) => setWinnerId(e.target.value)}
          placeholder="شناسه برنده"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          dir="ltr"
        />
        <button type="button" onClick={handleMarkWinner} className="rounded-lg bg-primary px-4 py-2 text-sm text-[#10111f]">
          ثبت برنده
        </button>
      </div>

      <p className="mb-4 text-xs text-white/50">
        جایزه نهایی به شرکت‌کننده‌ای تعلق می‌گیرد که در پایان کمپین بیشترین امتیاز را داشته باشد.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/50">
            <th className="p-2">رتبه</th>
            <th className="p-2">نام</th>
            <th className="p-2">موبایل</th>
            <th className="p-2">امتیاز</th>
            <th className="p-2">درست</th>
            <th className="p-2">شناسه</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId} className="border-b border-white/5">
              <td className="p-2">{u.rank}</td>
              <td className="p-2">{u.fullName}</td>
              <td className="p-2" dir="ltr">{u.maskedPhone}</td>
              <td className="p-2">{u.points.toLocaleString("fa-IR")}</td>
              <td className="p-2">{u.correctPredictions}</td>
              <td className="p-2 text-xs" dir="ltr">{u.userId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
