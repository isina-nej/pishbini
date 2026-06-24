import type { Metadata } from "next";
import { SplashScreen } from "@/components/public/SplashScreen";
import { AppProviders } from "@/components/public/AppProviders";
import { getPageAccessSettings } from "@/lib/page-access.server";
import "./globals.css";

export const metadata: Metadata = {
  title: "پیش‌بینی جام جهانی | پیشرو سرمایه",
  description: "کمپین پیش‌بینی جام جهانی پیشرو سرمایه",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#07080f",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialPageAccess = await getPageAccessSettings();

  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        <div className="app-background" aria-hidden />
        <SplashScreen />
        <div className="mx-auto min-h-dvh w-full max-w-[430px] [&:has(.admin-root)]:max-w-none [&:has(.bracket-root)]:max-w-none">
          <AppProviders initialPageAccess={initialPageAccess}>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
