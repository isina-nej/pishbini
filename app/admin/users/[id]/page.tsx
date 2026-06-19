"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPersianDateTime } from "@/lib/dates";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, [id]);

  if (!user) return <AdminLayout><p>بارگذاری...</p></AdminLayout>;

  const u = user as {
    firstName: string;
    lastName: string;
    phone: string;
    referralCode: string;
    referredByCode: string | null;
    points: number;
    predictions: Array<{
      prediction: string;
      isCorrect: boolean | null;
      pointsAwarded: number;
      match: { homeTeam: { nameFa: string }; awayTeam: { nameFa: string } };
    }>;
    smsLogs: Array<{ message: string; status: string; createdAt: string }>;
    pointTransactions: Array<{ type: string; points: number; reason: string | null; createdAt: string }>;
    referralsMade: Array<{ referred: { firstName: string; lastName: string } }>;
  };

  return (
    <AdminLayout>
      <h1 className="mb-2 text-2xl font-bold">{u.firstName} {u.lastName}</h1>
      <p className="mb-6 text-sm text-white/50" dir="ltr">{u.phone} — کد: {u.referralCode} — امتیاز: {u.points}</p>

      <section className="mb-6">
        <h2 className="mb-2 font-bold">پیش‌بینی‌ها</h2>
        {u.predictions.map((p, i) => (
          <div key={i} className="glass-card mb-2 p-3 text-sm">
            {p.match.homeTeam.nameFa} vs {p.match.awayTeam.nameFa} — {p.prediction}
            {p.isCorrect !== null && ` — ${p.isCorrect ? "درست" : "نادرست"} (${p.pointsAwarded})`}
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-bold">تراکنش‌های امتیاز</h2>
        {u.pointTransactions.map((t, i) => (
          <div key={i} className="mb-1 text-sm text-white/70">
            {t.type}: {t.points} — {t.reason} — {formatPersianDateTime(t.createdAt)}
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-bold">پیامک‌ها</h2>
        {u.smsLogs.map((s, i) => (
          <div key={i} className="mb-1 text-sm text-white/70">
            {s.status} — {formatPersianDateTime(s.createdAt)}
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-2 font-bold">دعوت‌ها ({u.referralsMade.length})</h2>
        {u.referralsMade.map((r, i) => (
          <div key={i} className="text-sm">{r.referred.firstName} {r.referred.lastName}</div>
        ))}
      </section>
    </AdminLayout>
  );
}
