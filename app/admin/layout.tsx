import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/site-metadata";
import "./admin.css";

export const metadata: Metadata = createPageMetadata({
  title: "پنل مدیریت",
  description: "پنل مدیریت کمپین پیش‌بینی",
  path: "/admin",
  noIndex: true,
});

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
