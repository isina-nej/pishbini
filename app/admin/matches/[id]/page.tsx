"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { AdminSettlementModal } from "@/components/admin/AdminSettlementModal";
import { formatPredictionChoice } from "@/lib/prediction-labels";
import { PredictionChoice } from "@/generated/prisma";
import { ArrowRight, Gavel, Pencil } from "lucide-react";

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

  if (!match) {
    return (
      <AdminLayout>
        <AdminLoading />
      </AdminLayout>
    );
  }

  const m = match as {
    homeTeam: { nameFa: string };
    awayTeam: { nameFa: string };
    status: string;
    settledAt: string | null;
    correctPrediction: PredictionChoice | null;
    homeScore: number | null;
    awayScore: number | null;
    settlementPushScheduledAt: string | null;
    settlementPushSentAt: string | null;
    predictions: Array<{
      id: string;
      prediction: string;
      user: { firstName: string; lastName: string; phone: string };
    }>;
  };

  const resultLabel =
    m.correctPrediction &&
    formatPredictionChoice(m.correctPrediction, m.homeTeam.nameFa, m.awayTeam.nameFa);

  const scoreLabel =
    m.homeScore !== null && m.awayScore !== null
      ? `${m.homeScore.toLocaleString("fa-IR")} – ${m.awayScore.toLocaleString("fa-IR")}`
      : null;

  return (
    <AdminLayout>
      <AdminPageHeader
        title={`${m.homeTeam.nameFa} vs ${m.awayTeam.nameFa}`}
        description="جزئیات بازی و پیش‌بینی‌ها"
        actions={
          <>
            <AdminStatusBadge status={m.status} />
            {!m.settledAt ? (
              <AdminButton size="sm" onClick={() => setShowSettle(true)}>
                <Gavel className="size-3.5" />
                ثبت نتیجه
              </AdminButton>
            ) : (
              <Link href="/admin/results">
                <AdminButton variant="outline" size="sm">
                  <Pencil className="size-3.5" />
                  ویرایش نتیجه
                </AdminButton>
              </Link>
            )}
            <Link href="/admin/matches">
              <AdminButton variant="outline" size="sm">
                <ArrowRight className="size-3.5" />
                بازگشت
              </AdminButton>
            </Link>
          </>
        }
      />

      {m.settledAt && (
        <div className="mb-4 rounded-xl bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">
          <p>نتیجه: {resultLabel}</p>
          {scoreLabel && <p className="mt-1 tabular-nums">گل: {scoreLabel}</p>}
          <p className="mt-1 text-xs opacity-80">
            {m.settlementPushSentAt
              ? "اعلان نتیجه برای کاربران ارسال شده است."
              : "اعلان نتیجه حدود ۱۰ دقیقه پس از آخرین ذخیره ارسال می‌شود."}
          </p>
        </div>
      )}

      <AdminCard>
        <AdminCardHeader
          title={`پیش‌بینی‌ها (${m.predictions.length.toLocaleString("fa-IR")})`}
        />
        {m.predictions.length === 0 ? (
          <AdminCardBody>
            <p className="text-center text-sm text-[var(--admin-text-muted)]">
              پیش‌بینی‌ای ثبت نشده
            </p>
          </AdminCardBody>
        ) : (
          <div className="admin-table-wrap border-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>موبایل</th>
                  <th>پیش‌بینی</th>
                </tr>
              </thead>
              <tbody>
                {m.predictions.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      {p.user.firstName} {p.user.lastName}
                    </td>
                    <td dir="ltr" className="font-mono text-xs text-[var(--admin-text-muted)]">
                      {p.user.phone}
                    </td>
                    <td>
                      <span className="rounded-md bg-[var(--admin-surface-elevated)] px-2 py-0.5 text-xs">
                        {p.prediction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

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
