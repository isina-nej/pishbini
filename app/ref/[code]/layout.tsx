import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/site-metadata";
import { normalizeReferralCode } from "@/lib/referral";

type Props = {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);
  const displayCode = (normalized ?? code).toUpperCase();

  return createPageMetadata({
    title: "دعوت به پیش‌بینی جام جهانی | پیشرو سرمایه",
    description: `با لینک دعوت ${displayCode} در کمپین پیش‌بینی جام جهانی پیشرو سرمایه شرکت کن و امتیاز بگیر.`,
    path: `/ref/${code}`,
  });
}

export default function RefLayout({ children }: { children: React.ReactNode }) {
  return children;
}
