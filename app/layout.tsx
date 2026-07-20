import type { Metadata } from "next";
import { SplashScreen } from "@/components/public/SplashScreen";
import { AppProviders } from "@/components/public/AppProviders";
import { PwaEarlyRegister } from "@/components/public/PwaEarlyRegister";
import { rootMetadata } from "@/lib/site-metadata";
import "./globals.css";

export const metadata: Metadata = rootMetadata;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#c8102e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
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
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
