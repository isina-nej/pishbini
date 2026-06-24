import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/site-metadata";
import "./bracket.css";

export const metadata: Metadata = createPageMetadata({
  title: "جدول حذفی | پیش‌بینی جام جهانی",
  description: "مسیر قهرمانی جام جهانی را پیش‌بینی کن و در کمپین پیشرو سرمایه شرکت کن.",
  path: "/bracket",
});

export default function BracketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bracket-root pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</div>
  );
}
