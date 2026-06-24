import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/site-metadata";

type Props = {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return createPageMetadata({
    title: "دعوت به پیش‌بینی جام جهانی | پیشرو سرمایه",
    description: `با لینک دعوت ${code.toUpperCase()} در کمپین پیش‌بینی جام جهانی پیشرو سرمایه شرکت کن.`,
    path: `/ref/${code}`,
  });
}

export default function RefLayout({ children }: { children: React.ReactNode }) {
  return children;
}
