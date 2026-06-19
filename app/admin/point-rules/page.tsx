"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

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

  const load = () =>
    fetch("/api/admin/point-rules")
      .then((r) => r.json())
      .then((d) => setRules(d.rules ?? []));

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
      <h1 className="mb-6 text-2xl font-bold">قوانین امتیاز</h1>
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="glass-card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{rule.label}</p>
              <p className="text-xs text-white/50">{rule.key} — {rule.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={rule.points}
                onBlur={(e) => handleUpdate(rule.id, Number(e.target.value))}
                className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center"
                dir="ltr"
              />
              <span className="text-sm text-white/50">امتیاز</span>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
