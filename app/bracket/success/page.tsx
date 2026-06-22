"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReferralCard } from "@/components/public/ReferralCard";
import { BottomNav } from "@/components/public/BottomNav";

type SuccessData = {
  firstName: string;
  referralCode: string;
  referralLink: string;
};

export default function BracketSuccessPage() {
  const router = useRouter();
  const [data, setData] = useState<SuccessData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("wc_bracket_success");
    if (!raw) {
      router.replace("/bracket");
      return;
    }
    try {
      setData(JSON.parse(raw) as SuccessData);
    } catch {
      router.replace("/bracket");
    }
  }, [router]);

  if (!data) return null;

  return (
    <div className="bracket-root pb-24 pt-10">
      <div className="px-4 text-center">
        <p className="text-lg font-bold text-[var(--bracket-primary)]">
          پیش‌بینی جدول حذفی شما با موفقیت ثبت شد.
        </p>
        <p className="mt-2 text-sm text-[var(--bracket-text-muted)]">
          {data.firstName} عزیز
        </p>
      </div>

      {data.referralLink ? (
        <ReferralCard referralCode={data.referralCode} referralLink={data.referralLink} />
      ) : (
        <p className="mt-4 text-center text-sm">کد دعوت: {data.referralCode}</p>
      )}

      <div className="mt-6 text-center">
        <Link href="/bracket" className="text-sm text-[var(--bracket-secondary)] underline">
          بازگشت به جدول
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
