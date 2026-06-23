import type { Metadata } from "next";
import { SplashScreen } from "@/components/public/SplashScreen";
import "./globals.css";

export const metadata: Metadata = {
  title: "پیش‌بینی جام جهانی | پیشرو سرمایه",
  description: "کمپین پیش‌بینی جام جهانی پیشرو سرمایه",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        <SplashScreen />
        <div className="mx-auto min-h-dvh w-full max-w-[430px] [&:has(.admin-root)]:max-w-none [&:has(.bracket-root)]:max-w-none">
          {children}
        </div>
      </body>
    </html>
  );
}
