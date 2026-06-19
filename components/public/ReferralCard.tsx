"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Check } from "lucide-react";
import Link from "next/link";

type Props = {
  referralCode: string;
  referralLink: string;
};

export function ReferralCard({ referralCode, referralLink }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "پیش‌بینی جام جهانی",
        text: `با لینک دعوت من در کمپین پیش‌بینی شرکت کن: ${referralLink}`,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card mx-4 p-6 text-center"
    >
      <p className="mb-2 text-sm text-white/65">کد دعوت شما</p>
      <motion.p
        key={copied ? "copied" : "code"}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="mb-4 text-2xl font-bold tracking-widest text-primary"
        dir="ltr"
      >
        {referralCode}
      </motion.p>
      <p className="mb-6 break-all text-xs text-white/50" dir="ltr">
        {referralLink}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          کپی لینک دعوت
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary/20 py-3 text-sm text-primary"
        >
          <Share2 className="h-4 w-4" />
          اشتراک‌گذاری
        </button>
      </div>

      <Link
        href="/leaderboard"
        className="mt-4 block text-sm text-secondary underline"
      >
        مشاهده جدول امتیازات
      </Link>
    </motion.div>
  );
}
