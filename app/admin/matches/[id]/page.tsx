"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSettlementModal } from "@/components/admin/AdminSettlementModal";

export default function AdminMatchDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [match, setMatch] = useState<Record<string, unknown> | null>(null);
  const [showSettle, setShowSettle] = useState(false);

  const load = () =>
    fetch(`/api/admin/matches/${id}`)
      .then((r) => r.json())
      .then((d) => setMatch(d.match));

  useEffect(() => {
    load();
  }, [id]);

  if (!match) return <AdminLayout><p>بارگذاری...</p></AdminLayout>;

  const m = match as {
    homeTeam: { nameFa: string };
    awayTeam: { nameFa: string };
    status: string;
    settledAt: string | null;
    predictions: Array<{
      id: string;
      prediction: string;
      user: { firstName: string; lastName: string; phone: string };
    }>;
  };

  return (
    <AdminLayout>
      <h1 className="mb-4 text-2xl font-bold">
        {m.homeTeam.nameFa} vs {m.awayTeam.nameFa}
      </h1>
      <p className="mb-4 text-sm text-white/50">وضعیت: {m.status}</p>

      {!m.settledAt && (
        <button
          type="button"
          onClick={() => setShowSettle(true)}
          className="mb-6 rounded-lg bg-primary px-4 py-2 font-bold text-[#10111f]"
        >
          ثبت نتیجه و تسویه
        </button>
      )}

      <h2 className="mb-2 font-bold">پیش‌بینی‌ها ({m.predictions.length})</h2>
      <div className="space-y-2">
        {m.predictions.map((p) => (
          <div key={p.id} className="glass-card p-3 text-sm">
            {p.user.firstName} {p.user.lastName} — {p.user.phone} — {p.prediction}
          </div>
        ))}
      </div>

      {showSettle && (
        <AdminSettlementModal
          matchId={id}
          onClose={() => setShowSettle(false)}
          onSettled={() => {
            setShowSettle(false);
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}
