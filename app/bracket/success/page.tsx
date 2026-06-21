"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BracketSuccessPage() {
  const router = useRouter();
  const [data, setData] = useState<{ firstName: string; referralCode: string } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("wc_bracket_success");
    if (!raw) {
      router.replace("/bracket");
      return;
    }
    setData(JSON.parse(raw));
  }, [router]);

  if (!data) return null;

  return (
    <div className="bracket-root flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <p className="text-lg font-bold text-[var(--bracket-primary)]">
        پیش‌بینی جدول حذفی شما با موفقیت ثبت شد.
      </p>
      <p className="mt-2 text-sm text-[var(--bracket-text-muted)]">
        {data.firstName} عزیز، کد دعوت: {data.referralCode}
      </p>
      <Link
        href="/bracket"
        className="mt-6 text-sm text-[var(--bracket-secondary)] underline"
      >
        بازگشت به جدول
      </Link>
    </div>
  );
}
