import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "پیش‌بینی جام جهانی | پیشرو سرمایه",
  description: "کمپین پیش‌بینی جام جهانی پیشرو سرمایه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} antialiased`}>
        <div className="mx-auto min-h-dvh w-full max-w-[430px] [&:has(.bracket-root)]:max-w-none">
          {children}
        </div>
      </body>
    </html>
  );
}
