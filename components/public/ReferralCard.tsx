"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Check, Link2 } from "lucide-react";
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
        text: `با لینک دعوت من در کمپین پیش‌بینی شرکت کن:\n${referralLink}`,
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
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/15">
        <Link2 className="size-5 text-primary" />
      </div>
      <p className="mb-2 text-sm text-white/65">لینک دعوت شما</p>
      <p className="mb-1 break-all text-sm font-medium leading-relaxed text-primary" dir="ltr">
        {referralLink}
      </p>
      <p className="mb-6 text-[10px] text-white/40">
        این لینک را برای دوستانتان بفرستید — همان لینکی که در پیامک تأیید ارسال می‌شود
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          کپی لینک
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

      <p className="mt-4 text-[10px] text-white/35" dir="ltr">
        {referralCode}
      </p>

      <Link
        href="/leaderboard"
        className="mt-4 block text-sm text-secondary underline"
      >
        مشاهده جدول امتیازات
      </Link>
    </motion.div>
  );
}
