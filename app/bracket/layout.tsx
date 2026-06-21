import type { Metadata } from "next";
import "./bracket.css";

export const metadata: Metadata = {
  title: "جدول حذفی | پیش‌بینی جام جهانی",
  description: "پیش‌بینی مسیر قهرمانی جام جهانی",
};

export default function BracketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bracket-root pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</div>
  );
}
