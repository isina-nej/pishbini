"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode: string;
  points: number;
  totalPredictions: number;
  correctPredictions: number;
  referralCount: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  const load = (search = "") => {
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    fetch(`/api/admin/users${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">شرکت‌کنندگان</h1>
        <a
          href="/api/admin/users/export"
          className="rounded-lg bg-secondary px-4 py-2 text-sm text-white"
        >
          خروجی CSV
        </a>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        />
        <button type="button" onClick={() => load(q)} className="rounded-lg bg-primary px-4 py-2 text-[#10111f]">
          جستجو
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="p-2 text-right">نام</th>
              <th className="p-2 text-right">موبایل</th>
              <th className="p-2 text-right">امتیاز</th>
              <th className="p-2 text-right">درست</th>
              <th className="p-2 text-right">دعوت</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="p-2">{u.firstName} {u.lastName}</td>
                <td className="p-2" dir="ltr">{u.phone}</td>
                <td className="p-2">{u.points.toLocaleString("fa-IR")}</td>
                <td className="p-2">{u.correctPredictions}</td>
                <td className="p-2">{u.referralCount}</td>
                <td className="p-2">
                  <Link href={`/admin/users/${u.id}`} className="text-secondary">جزئیات</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
