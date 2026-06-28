"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { Download, Search, Eye, EyeOff, UserRound } from "lucide-react";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode: string;
  points: number;
  totalPredictions: number;
  correctPredictions: number;
  wrongPredictions: number;
  referralCount: number;
  hidden: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (search = "") => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    fetch(`/api/admin/users${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleHide = async (u: User) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !u.hidden }),
    });
    load(q);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="شرکت‌کنندگان"
        description={`${users.length.toLocaleString("fa-IR")} کاربر`}
        actions={
          <a href="/api/admin/users/export">
            <AdminButton variant="secondary" size="sm">
              <Download className="size-3.5" />
              خروجی CSV
            </AdminButton>
          </a>
        }
      />

      <div className="mb-4 flex gap-2">
        <AdminInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو با نام، موبایل یا کد دعوت..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && load(q)}
        />
        <AdminButton onClick={() => load(q)}>
          <Search className="size-4" />
          جستجو
        </AdminButton>
      </div>

      <AdminCard>
        <AdminCardHeader title="لیست شرکت‌کنندگان" />
        {loading ? (
          <AdminLoading />
        ) : (
          <div className="admin-table-wrap border-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>موبایل</th>
                  <th>وضعیت</th>
                  <th>امتیاز</th>
                  <th>پیش‌بینی</th>
                  <th>درست</th>
                  <th>غلط</th>
                  <th>دعوت</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.hidden ? "opacity-60" : undefined}>
                    <td className="font-medium">
                      {u.firstName} {u.lastName}
                    </td>
                    <td dir="ltr" className="font-mono text-xs text-[var(--admin-text-muted)]">
                      {u.phone}
                    </td>
                    <td>
                      {u.hidden ? (
                        <AdminBadge tone="warning">مخفی</AdminBadge>
                      ) : (
                        <AdminBadge tone="success">فعال</AdminBadge>
                      )}
                    </td>
                    <td className="font-bold tabular-nums text-[var(--admin-primary)]">
                      {u.points.toLocaleString("fa-IR")}
                    </td>
                    <td className="tabular-nums">{u.totalPredictions}</td>
                    <td className="tabular-nums">{u.correctPredictions}</td>
                    <td className="tabular-nums">{u.wrongPredictions}</td>
                    <td className="tabular-nums">{u.referralCount}</td>
                    <td>
                      <div className="flex gap-1">
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          title={u.hidden ? "نمایش" : "مخفی"}
                          onClick={() => toggleHide(u)}
                        >
                          {u.hidden ? (
                            <Eye className="size-3.5" />
                          ) : (
                            <EyeOff className="size-3.5" />
                          )}
                        </AdminButton>
                        <Link href={`/admin/users/${u.id}`}>
                          <AdminButton variant="ghost" size="sm" title="جزئیات">
                            <UserRound className="size-3.5" />
                          </AdminButton>
                        </Link>
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
