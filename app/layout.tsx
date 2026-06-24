import type { Metadata } from "next";
import { SplashScreen } from "@/components/public/SplashScreen";
import { AppProviders } from "@/components/public/AppProviders";
import { PwaEarlyRegister } from "@/components/public/PwaEarlyRegister";
import { getPageAccessSettings } from "@/lib/page-access.server";
import "./globals.css";

export const metadata: Metadata = {
  title: "پیش‌بینی جام جهانی | پیشرو سرمایه",
  description: "کمپین پیش‌بینی جام جهانی پیشرو سرمایه",
  applicationName: "پیش‌بینی پیشرو",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "پیش‌بینی",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
      </head>
      <body className="antialiased">
        <PwaEarlyRegister />
        <div className="app-background" aria-hidden />
        <SplashScreen />
        <div className="mx-auto min-h-dvh w-full max-w-[430px] [&:has(.admin-root)]:max-w-none [&:has(.bracket-root)]:max-w-none">
          <AppProviders initialPageAccess={initialPageAccess}>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
