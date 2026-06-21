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
import { ArrowRight, Gavel } from "lucide-react";

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
    predictions: Array<{
      id: string;
      prediction: string;
      user: { firstName: string; lastName: string; phone: string };
    }>;
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title={`${m.homeTeam.nameFa} vs ${m.awayTeam.nameFa}`}
        description="جزئیات بازی و پیش‌بینی‌ها"
        actions={
          <>
            <AdminStatusBadge status={m.status} />
            {!m.settledAt && (
              <AdminButton size="sm" onClick={() => setShowSettle(true)}>
                <Gavel className="size-3.5" />
                ثبت نتیجه
              </AdminButton>
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
          این بازی تسویه شده است
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
