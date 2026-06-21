"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";

type Rule = {
  id: string;
  key: string;
  label: string;
  points: number;
  active: boolean;
  description: string | null;
};

export default function AdminPointRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/point-rules")
      .then((r) => r.json())
      .then((d) => setRules(d.rules ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (id: string, points: number) => {
    await fetch(`/api/admin/point-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
    load();
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="قوانین امتیاز"
        description="مقادیر امتیاز از این جدول خوانده می‌شوند — تغییرات بلافاصله اعمال می‌شود"
      />

      {loading ? (
        <AdminLoading />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <AdminCard key={rule.id}>
              <AdminCardBody>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{rule.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--admin-text-subtle)]" dir="ltr">
                      {rule.key}
                    </p>
                  </div>
                  <AdminBadge tone={rule.active ? "success" : "default"}>
                    {rule.active ? "فعال" : "غیرفعال"}
                  </AdminBadge>
                </div>
                {rule.description && (
                  <p className="mb-4 text-sm text-[var(--admin-text-muted)]">{rule.description}</p>
                )}
                <div className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-3">
                  <AdminInput
                    type="number"
                    defaultValue={rule.points}
                    onBlur={(e) => handleUpdate(rule.id, Number(e.target.value))}
                    className="w-28 text-center font-bold"
                    dir="ltr"
                  />
                  <span className="text-sm text-[var(--admin-text-muted)]">امتیاز</span>
                </div>
              </AdminCardBody>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
