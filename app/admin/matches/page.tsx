"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput, AdminSelect, AdminLabel } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { formatPersianDateTime } from "@/lib/dates";
import { Eye, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
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
      <AdminPageHeader
        title="مدیریت بازی‌ها"
        description={`${matches.length.toLocaleString("fa-IR")} بازی ثبت شده`}
      />

      <AdminCard className="mb-6">
        <AdminCardHeader title="افزودن بازی جدید" description="زمان شروع و وضعیت را تنظیم کنید" />
        <AdminCardBody>
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <AdminLabel>تیم میزبان</AdminLabel>
              <AdminSelect
                value={form.homeTeamId}
                onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}
                required
              >
                <option value="">انتخاب...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.nameFa}</option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <AdminLabel>تیم میهمان</AdminLabel>
              <AdminSelect
                value={form.awayTeamId}
                onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}
                required
              >
                <option value="">انتخاب...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.nameFa}</option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <AdminLabel>زمان شروع</AdminLabel>
              <AdminInput
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                dir="ltr"
                required
              />
            </div>
            <div>
              <AdminLabel>وضعیت</AdminLabel>
              <AdminSelect
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="LOCKED">LOCKED</option>
                <option value="FINISHED">FINISHED</option>
                <option value="CANCELLED">CANCELLED</option>
              </AdminSelect>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <AdminButton type="submit">افزودن بازی</AdminButton>
            </div>
          </form>
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader title="لیست بازی‌ها" />
        {loading ? (
          <AdminLoading />
        ) : (
          <div className="admin-table-wrap border-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>مسابقه</th>
                  <th>زمان</th>
                  <th>وضعیت</th>
                  <th>پیش‌بینی</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium">
                      {m.homeTeam.nameFa}
                      <span className="mx-1.5 text-[var(--admin-text-subtle)]">vs</span>
                      {m.awayTeam.nameFa}
                    </td>
                    <td className="text-xs text-[var(--admin-text-muted)]">
                      {formatPersianDateTime(m.startTime)}
                    </td>
                    <td>
                      <AdminStatusBadge status={m.status} />
                    </td>
                    <td className="tabular-nums">{m._count.predictions.toLocaleString("fa-IR")}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/matches/${m.id}`}>
                          <AdminButton variant="ghost" size="sm">
                            <Eye className="size-3.5" />
                          </AdminButton>
                        </Link>
                        <AdminButton variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="size-3.5 text-[var(--admin-danger)]" />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
