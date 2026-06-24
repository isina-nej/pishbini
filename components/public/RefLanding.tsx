"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { normalizeReferralCode } from "@/lib/referral";
import { setStoredReferralCode } from "@/lib/predictions-storage";

type Props = {
  code: string;
};

/**
 * Crawlers read OG tags from the server HTML and do not run this redirect.
 * Real users are sent to home after storing the referral code.
 */
export function RefLanding({ code }: Props) {
  const router = useRouter();
  const displayCode = (normalizeReferralCode(code) ?? code).toUpperCase();

  useEffect(() => {
    const normalized = normalizeReferralCode(code);
    if (normalized) {
      setStoredReferralCode(normalized);
    }
    router.replace("/");
  }, [code, router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-white">پیش‌بینی جام جهانی</h1>
      <p className="text-sm text-white/75">
        با لینک دعوت <span className="font-mono text-primary">{displayCode}</span> در کمپین پیشرو
        سرمایه شرکت کن.
      </p>
      <p className="text-xs text-white/50">در حال انتقال به صفحه اصلی…</p>
      <noscript>
        <a href="/" className="text-sm text-primary underline">
          ورود به سایت
        </a>
      </noscript>
    </main>
  );
}
