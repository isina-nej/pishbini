"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPersianDateTime } from "@/lib/dates";

type Team = { id: string; nameFa: string; code: string };
type Match = {
  id: string;
  startTime: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  _count: { predictions: number };
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    homeTeamId: "",
    awayTeamId: "",
    startTime: "",
    status: "SCHEDULED",
  });

  const load = async () => {
    const [mRes, tRes] = await Promise.all([
      fetch("/api/admin/matches"),
      fetch("/api/admin/teams"),
    ]);
    const mData = await mRes.json();
    const tData = await tRes.json();
    setMatches(mData.matches ?? []);
    setTeams(tData.teams ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startTime: new Date(form.startTime).toISOString(),
      }),
    });
    setForm({ homeTeamId: "", awayTeamId: "", startTime: "", status: "SCHEDULED" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف بازی؟")) return;
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    load();
  };

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold">مدیریت بازی‌ها</h1>

      <form onSubmit={handleCreate} className="glass-card mb-8 grid gap-3 p-4 md:grid-cols-2">
        <select
          value={form.homeTeamId}
          onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        >
          <option value="">تیم میزبان</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.nameFa}</option>
          ))}
        </select>
        <select
          value={form.awayTeamId}
          onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        >
          <option value="">تیم میهمان</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.nameFa}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        >
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="LOCKED">LOCKED</option>
          <option value="FINISHED">FINISHED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button type="submit" className="rounded-lg bg-primary py-2 font-bold text-[#10111f] md:col-span-2">
          افزودن بازی
        </button>
      </form>

      <div className="space-y-2">
        {matches.map((m) => (
          <div key={m.id} className="glass-card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {m.homeTeam.nameFa} vs {m.awayTeam.nameFa}
              </p>
              <p className="text-xs text-white/50">
                {formatPersianDateTime(m.startTime)} — {m.status} — {m._count.predictions} پیش‌بینی
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/matches/${m.id}`} className="text-sm text-secondary">
                جزئیات
              </Link>
              <button type="button" onClick={() => handleDelete(m.id)} className="text-sm text-danger">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
