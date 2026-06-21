"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput, AdminLabel } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { Pencil, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
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
      .then((d) => setTeams(d.teams ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ nameFa: "", nameEn: "", code: "", flagUrl: "", isActive: true });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/teams/${editingId}` : "/api/admin/teams";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    resetForm();
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
      <AdminPageHeader
        title="مدیریت تیم‌ها"
        description={`${teams.length.toLocaleString("fa-IR")} تیم ثبت شده`}
      />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <AdminCard>
          <AdminCardHeader
            title={editingId ? "ویرایش تیم" : "افزودن تیم"}
            description="اطلاعات تیم را وارد کنید"
          />
          <AdminCardBody>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <AdminLabel>نام فارسی</AdminLabel>
                <AdminInput
                  value={form.nameFa}
                  onChange={(e) => setForm({ ...form, nameFa: e.target.value })}
                  required
                />
              </div>
              <div>
                <AdminLabel>نام انگلیسی</AdminLabel>
                <AdminInput
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <AdminLabel>کد (۳ حرفی)</AdminLabel>
                <AdminInput
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  dir="ltr"
                  maxLength={3}
                  required
                />
              </div>
              <div>
                <AdminLabel>آدرس پرچم</AdminLabel>
                <AdminInput
                  value={form.flagUrl}
                  onChange={(e) => setForm({ ...form, flagUrl: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
              <div className="flex gap-2 pt-1">
                <AdminButton type="submit" className="flex-1">
                  {editingId ? "ذخیره تغییرات" : "افزودن تیم"}
                </AdminButton>
                {editingId && (
                  <AdminButton type="button" variant="outline" onClick={resetForm}>
                    انصراف
                  </AdminButton>
                )}
              </div>
            </form>
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="لیست تیم‌ها" />
          {loading ? (
            <AdminLoading />
          ) : teams.length === 0 ? (
            <AdminCardBody>
              <p className="text-center text-sm text-[var(--admin-text-muted)]">تیمی ثبت نشده</p>
            </AdminCardBody>
          ) : (
            <div className="admin-table-wrap border-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>تیم</th>
                    <th>کد</th>
                    <th>وضعیت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Image
                            src={t.flagUrl}
                            alt=""
                            width={28}
                            height={20}
                            className="rounded-sm object-cover"
                          />
                          <div>
                            <p className="font-medium">{t.nameFa}</p>
                            <p className="text-xs text-[var(--admin-text-subtle)]">{t.nameEn}</p>
                          </div>
                        </div>
                      </td>
                      <td dir="ltr" className="font-mono text-xs">
                        {t.code}
                      </td>
                      <td>
                        <AdminBadge tone={t.isActive ? "success" : "default"}>
                          {t.isActive ? "فعال" : "غیرفعال"}
                        </AdminBadge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setForm(t);
                              setEditingId(t.id);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </AdminButton>
                          <AdminButton variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
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
      </div>
    </AdminLayout>
  );
}
