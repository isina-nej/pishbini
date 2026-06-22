"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { AdminToggle } from "@/components/admin/ui/AdminToggle";
import {
  DEFAULT_CAMPAIGN_INFO,
  type CampaignInfoContent,
  type CampaignInfoSection,
  type CampaignInfoSectionIcon,
} from "@/lib/campaign-info";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";

const ICON_OPTIONS: { value: CampaignInfoSectionIcon; label: string }[] = [
  { value: "trophy", label: "جام" },
  { value: "target", label: "هدف" },
  { value: "users", label: "کاربران" },
  { value: "star", label: "ستاره" },
  { value: "gift", label: "هدیه" },
  { value: "zap", label: "برق" },
  { value: "medal", label: "مدال" },
  { value: "calendar", label: "تقویم" },
];

const fieldClass =
  "w-full resize-none rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition-colors placeholder:text-[var(--admin-text-subtle)] focus:border-[var(--admin-primary)]";

const selectClass =
  "w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-4 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-primary)]";

export default function AdminCampaignInfoPage() {
  const [content, setContent] = useState<CampaignInfoContent>(DEFAULT_CAMPAIGN_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/campaign-info")
      .then((r) => r.json())
      .then((d) => {
        if (d.content) setContent(d.content);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof CampaignInfoContent>(key: K, value: CampaignInfoContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateSection = (index: number, patch: Partial<CampaignInfoSection>) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
    setSaved(false);
  };

  const addSection = () => {
    setContent((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `section-${Date.now()}`,
          icon: "star",
          title: "بخش جدید",
          body: "توضیحات این بخش را وارد کنید.",
        },
      ],
    }));
    setSaved(false);
  };

  const removeSection = (index: number) => {
    if (content.sections.length <= 1) return;
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const updatePrizeItem = (index: number, value: string) => {
    setContent((prev) => ({
      ...prev,
      prizeItems: prev.prizeItems.map((item, i) => (i === index ? value : item)),
    }));
    setSaved(false);
  };

  const addPrizeItem = () => {
    setContent((prev) => ({ ...prev, prizeItems: [...prev.prizeItems, ""] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/campaign-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="جوایز و امتیازدهی"
        description="محتوای صفحه عمومی /prizes — امتیازها از قوانین امتیاز خوانده می‌شوند"
        actions={
          <>
            <a href="/prizes" target="_blank" rel="noreferrer">
              <AdminButton variant="outline" size="sm">
                <ExternalLink className="size-3.5" />
                پیش‌نمایش
              </AdminButton>
            </a>
            <AdminButton onClick={handleSave} disabled={saving}>
              <Save className="size-3.5" />
              {saving ? "در حال ذخیره..." : saved ? "ذخیره شد" : "ذخیره"}
            </AdminButton>
          </>
        }
      />

      {loading ? (
        <AdminLoading />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminCard className="lg:col-span-2">
            <AdminCardHeader title="انتشار" />
            <AdminCardBody>
              <AdminToggle
                label="نمایش صفحه برای کاربران"
                description="در صورت غیرفعال بودن، صفحه جوایز پیام خطا نشان می‌دهد"
                checked={content.published}
                onChange={(published) => update("published", published)}
              />
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="هدر صفحه" />
            <AdminCardBody className="space-y-3">
              <Field label="عنوان">
                <AdminInput
                  value={content.heroTitle}
                  onChange={(e) => update("heroTitle", e.target.value)}
                />
              </Field>
              <Field label="زیرعنوان">
                <textarea
                  value={content.heroSubtitle}
                  onChange={(e) => update("heroSubtitle", e.target.value)}
                  rows={3}
                  className={fieldClass}
                />
              </Field>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="بخش جایزه" />
            <AdminCardBody className="space-y-3">
              <Field label="عنوان جایزه">
                <AdminInput
                  value={content.prizeTitle}
                  onChange={(e) => update("prizeTitle", e.target.value)}
                />
              </Field>
              <Field label="توضیح جایزه">
                <textarea
                  value={content.prizeDescription}
                  onChange={(e) => update("prizeDescription", e.target.value)}
                  rows={4}
                  className={fieldClass}
                />
              </Field>
              <Field label="موارد جایزه (لیست)">
                <div className="space-y-2">
                  {content.prizeItems.map((item, i) => (
                    <AdminInput
                      key={i}
                      value={item}
                      onChange={(e) => updatePrizeItem(i, e.target.value)}
                      placeholder={`مورد ${i + 1}`}
                    />
                  ))}
                  <AdminButton variant="outline" size="sm" onClick={addPrizeItem}>
                    <Plus className="size-3.5" />
                    افزودن مورد
                  </AdminButton>
                </div>
              </Field>
            </AdminCardBody>
          </AdminCard>

          <AdminCard className="lg:col-span-2">
            <AdminCardHeader title="بخش امتیازدهی (متن)" description="اعداد امتیاز از «قوانین امتیاز» خوانده می‌شوند" />
            <AdminCardBody className="space-y-3">
              <Field label="عنوان">
                <AdminInput
                  value={content.scoringTitle}
                  onChange={(e) => update("scoringTitle", e.target.value)}
                />
              </Field>
              <Field label="مقدمه">
                <textarea
                  value={content.scoringIntro}
                  onChange={(e) => update("scoringIntro", e.target.value)}
                  rows={2}
                  className={fieldClass}
                />
              </Field>
            </AdminCardBody>
          </AdminCard>

          <AdminCard className="lg:col-span-2">
            <AdminCardHeader
              title="بخش‌های توضیحی"
              description="کارت‌های راهنما در صفحه عمومی"
              action={
                <AdminButton variant="outline" size="sm" onClick={addSection}>
                  <Plus className="size-3.5" />
                  بخش جدید
                </AdminButton>
              }
            />
            <AdminCardBody className="space-y-4">
              {content.sections.map((section, i) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--admin-text-muted)]">بخش {i + 1}</span>
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(i)}
                      disabled={content.sections.length <= 1}
                    >
                      <Trash2 className="size-3.5 text-[var(--admin-danger)]" />
                    </AdminButton>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="آیکن">
                      <select
                        value={section.icon}
                        onChange={(e) =>
                          updateSection(i, { icon: e.target.value as CampaignInfoSectionIcon })
                        }
                        className={selectClass}
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="عنوان">
                      <AdminInput
                        value={section.title}
                        onChange={(e) => updateSection(i, { title: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="متن" className="mt-3">
                    <textarea
                      value={section.body}
                      onChange={(e) => updateSection(i, { body: e.target.value })}
                      rows={3}
                      className={fieldClass}
                    />
                  </Field>
                </div>
              ))}
            </AdminCardBody>
          </AdminCard>

          <AdminCard className="lg:col-span-2">
            <AdminCardHeader title="پاورقی" />
            <AdminCardBody>
              <textarea
                value={content.footnote}
                onChange={(e) => update("footnote", e.target.value)}
                rows={3}
                className={`${fieldClass} w-full`}
              />
            </AdminCardBody>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
