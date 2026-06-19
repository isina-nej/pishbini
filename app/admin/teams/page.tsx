"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type Team = {
  id: string;
  nameFa: string;
  nameEn: string;
  code: string;
  flagUrl: string;
  isActive: boolean;
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    nameFa: "",
    nameEn: "",
    code: "",
    flagUrl: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () =>
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/teams/${editingId}` : "/api/admin/teams";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ nameFa: "", nameEn: "", code: "", flagUrl: "", isActive: true });
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف تیم؟")) return;
    const res = await fetch(`/api/admin/teams/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    load();
  };

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold">مدیریت تیم‌ها</h1>

      <form onSubmit={handleSubmit} className="glass-card mb-8 grid gap-3 p-4 md:grid-cols-2">
        <input
          placeholder="نام فارسی"
          value={form.nameFa}
          onChange={(e) => setForm({ ...form, nameFa: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        />
        <input
          placeholder="نام انگلیسی"
          value={form.nameEn}
          onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        />
        <input
          placeholder="کد (IRI)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        />
        <input
          placeholder="آدرس پرچم"
          value={form.flagUrl}
          onChange={(e) => setForm({ ...form, flagUrl: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          required
        />
        <button type="submit" className="rounded-lg bg-primary py-2 font-bold text-[#10111f] md:col-span-2">
          {editingId ? "ویرایش تیم" : "افزودن تیم"}
        </button>
      </form>

      <div className="space-y-2">
        {teams.map((t) => (
          <div key={t.id} className="glass-card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{t.nameFa} ({t.code})</p>
              <p className="text-xs text-white/50">{t.nameEn}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(t);
                  setEditingId(t.id);
                }}
                className="text-sm text-secondary"
              >
                ویرایش
              </button>
              <button type="button" onClick={() => handleDelete(t.id)} className="text-sm text-danger">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
