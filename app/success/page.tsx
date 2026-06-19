"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ReferralCard } from "@/components/public/ReferralCard";
import { BottomNav } from "@/components/public/BottomNav";

type SuccessData = {
  referralCode: string;
  referralLink: string;
  firstName: string;
  points: number;
};

export default function SuccessPage() {
  const router = useRouter();
  const [data, setData] = useState<SuccessData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("wc_success");
    if (!raw) {
      router.replace("/");
      return;
    }
    const parsed = JSON.parse(raw) as SuccessData;
    setData(parsed);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#14e0bd", "#4365ff", "#ffffff"],
    });
  }, [router]);

  if (!data) return null;

  return (
    <div className="pb-24 pt-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 px-4 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl">
          ✓
        </div>
        <h1 className="text-xl font-bold text-success">پیش‌بینی شما با موفقیت ثبت شد.</h1>
        <p className="mt-2 text-sm text-white/65">
          {data.firstName} عزیز، امتیاز شما: {data.points.toLocaleString("fa-IR")}
        </p>
      </motion.div>

      <ReferralCard referralCode={data.referralCode} referralLink={data.referralLink} />
      <BottomNav />
    </div>
  );
}
