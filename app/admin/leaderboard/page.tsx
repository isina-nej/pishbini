"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { Download, Snowflake, Trophy } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setFrozen(d.campaignFrozen ?? false);
        setWinnerId(d.prizeWinnerUserId ?? "");
      })
      .finally(() => setLoading(false));

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
      <AdminPageHeader
        title="جدول امتیازات"
        description="رتبه‌بندی شرکت‌کنندگان و مدیریت پایان کمپین"
        actions={
          <>
            <AdminBadge tone={frozen ? "danger" : "success"}>
              {frozen ? "کمپین فریز شده" : "کمپین فعال"}
            </AdminBadge>
            <a href="/api/admin/leaderboard/export">
              <AdminButton variant="secondary" size="sm">
                <Download className="size-3.5" />
                CSV
              </AdminButton>
            </a>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
        <AdminButton
          variant={frozen ? "danger" : "outline"}
          size="sm"
          onClick={handleFreeze}
        >
          <Snowflake className="size-3.5" />
          {frozen ? "لغو فریز" : "فریز کمپین"}
        </AdminButton>
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs text-[var(--admin-text-muted)]">شناسه برنده</label>
            <AdminInput
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              placeholder="user-id"
              dir="ltr"
            />
          </div>
          <AdminButton size="sm" onClick={handleMarkWinner}>
            <Trophy className="size-3.5" />
            ثبت برنده
          </AdminButton>
        </div>
      </div>

      <AdminCard>
        <AdminCardHeader
          title="رتبه‌بندی"
          description="مرتب‌سازی: امتیاز ↓، پیش‌بینی درست ↓، تاریخ ثبت ↑"
        />
        {loading ? (
          <AdminLoading />
        ) : (
          <div className="admin-table-wrap border-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>رتبه</th>
                  <th>نام</th>
                  <th>موبایل</th>
                  <th>امتیاز</th>
                  <th>درست</th>
                  <th>شناسه</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <span
                        className={`inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                          u.rank <= 3
                            ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]"
                            : "bg-[var(--admin-surface-elevated)] text-[var(--admin-text-muted)]"
                        }`}
                      >
                        {u.rank}
                      </span>
                    </td>
                    <td className="font-medium">{u.fullName}</td>
                    <td dir="ltr" className="font-mono text-xs text-[var(--admin-text-muted)]">
                      {u.maskedPhone}
                    </td>
                    <td className="font-bold tabular-nums text-[var(--admin-primary)]">
                      {u.points.toLocaleString("fa-IR")}
                    </td>
                    <td className="tabular-nums">{u.correctPredictions}</td>
                    <td dir="ltr" className="max-w-[120px] truncate text-[10px] text-[var(--admin-text-subtle)]">
                      {u.userId}
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
