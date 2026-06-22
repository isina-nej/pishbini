"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { AdminToggle } from "@/components/admin/ui/AdminToggle";
import {
  DEFAULT_PAGE_ACCESS,
  PAGE_LABELS,
  type PageAccessSettings,
  type PageId,
} from "@/lib/page-access";
import { Save } from "lucide-react";

const PAGE_IDS: PageId[] = ["predictions", "bracket", "leaderboard"];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageAccessSettings>(DEFAULT_PAGE_ACCESS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pages/access")
      .then((r) => r.json())
      .then((d) => {
        if (d.pages) setPages(d.pages);
      })
      .finally(() => setLoading(false));
  }, []);

  const updatePage = (id: PageId, patch: Partial<PageAccessSettings[PageId]>) => {
    setPages((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/pages/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pages),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="دسترسی صفحات"
        description="فعال یا غیرفعال کردن صفحات اصلی سایت و متن نمایشی برای کاربران"
        actions={
          <AdminButton onClick={handleSave} disabled={saving}>
            <Save className="size-3.5" />
            {saving ? "در حال ذخیره..." : saved ? "ذخیره شد" : "ذخیره تغییرات"}
          </AdminButton>
        }
      />

      {loading ? (
        <AdminLoading />
      ) : (
        <div className="grid gap-4">
          {PAGE_IDS.map((id) => (
            <AdminCard key={id}>
              <AdminCardHeader
                title={PAGE_LABELS[id]}
                description={
                  id === "predictions"
                    ? "صفحه اصلی پیش‌بینی بازی‌ها"
                    : id === "bracket"
                      ? "صفحه جدول حذفی"
                      : "صفحه جدول امتیازات"
                }
              />
              <AdminCardBody className="space-y-4">
                <AdminToggle
                  label="دسترسی کاربران"
                  description={
                    pages[id].enabled
                      ? "صفحه برای کاربران باز است"
                      : "با کلیک روی این صفحه، پیام زیر نمایش داده می‌شود"
                  }
                  checked={pages[id].enabled}
                  onChange={(enabled) => updatePage(id, { enabled })}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    متن نمایشی هنگام غیرفعال بودن
                  </label>
                  <textarea
                    value={pages[id].message}
                    onChange={(e) => updatePage(id, { message: e.target.value })}
                    rows={3}
                    maxLength={500}
                    placeholder="مثلاً: این بخش به‌زودی فعال می‌شود."
                    className="w-full resize-none rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition-colors placeholder:text-[var(--admin-text-subtle)] focus:border-[var(--admin-primary)]"
                  />
                  <p className="mt-1 text-xs text-[var(--admin-text-subtle)]">
                    {pages[id].message.length.toLocaleString("fa-IR")} / ۵۰۰
                  </p>
                </div>
              </AdminCardBody>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
