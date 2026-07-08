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
import { Download, Search, Eye, EyeOff, UserRound, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");

  const load = (search = "", currentSortBy = sortBy, currentSortOrder = sortOrder, forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (search) params.append("q", search);
    params.append("sortBy", currentSortBy);
    params.append("sortOrder", currentSortOrder);
    if (forceRefresh) params.append("refresh", "true");

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load(q, sortBy, sortOrder);
  }, [sortBy, sortOrder]);

  const handleSearch = () => {
    load(q, sortBy, sortOrder);
  };

  const handleRefresh = () => {
    load(q, sortBy, sortOrder, true);
  };

  const toggleHide = async (u: User) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !u.hidden }),
    });
    // Force refresh cache to see changes immediately
    load(q, sortBy, sortOrder, true);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />;
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="شرکت‌کنندگان"
        description={`${users.length.toLocaleString("fa-IR")} کاربر`}
        actions={
          <div className="flex gap-2">
            <AdminButton variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              بروزرسانی
            </AdminButton>
            <a href="/api/admin/users/export">
              <AdminButton variant="secondary" size="sm">
                <Download className="size-3.5" />
                خروجی CSV
              </AdminButton>
            </a>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <AdminInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو با نام، موبایل یا کد دعوت..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <AdminButton onClick={handleSearch}>
          <Search className="size-4" />
          جستجو
        </AdminButton>
      </div>

      <AdminCard>
        <AdminCardHeader title="لیست تمام شرکت‌کنندگان" />
        {loading ? (
          <AdminLoading />
        ) : (
          <div className="admin-table-wrap border-0 max-h-[70vh] overflow-auto">
            <table className="admin-table">
              <thead className="sticky top-0 bg-[var(--admin-card-bg)] z-10 shadow-sm">
                <tr>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("firstName")}>
                    نام <SortIcon field="firstName" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("phone")}>
                    موبایل <SortIcon field="phone" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("hidden")}>
                    وضعیت <SortIcon field="hidden" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("points")}>
                    امتیاز <SortIcon field="points" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("totalPredictions")}>
                    پیش‌بینی <SortIcon field="totalPredictions" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("correctPredictions")}>
                    درست <SortIcon field="correctPredictions" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("wrongPredictions")}>
                    غلط <SortIcon field="wrongPredictions" />
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("referralCount")}>
                    دعوت <SortIcon field="referralCount" />
                  </th>
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
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[var(--admin-text-muted)]">
                      کاربری یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
