"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

export type ReferralListItem = {
  firstName: string;
  lastName: string;
  registeredAtLabel: string;
};

type Props = {
  referrals: ReferralListItem[];
  loading?: boolean;
  error?: string | null;
};

export function ProfileReferralsList({ referrals, loading, error }: Props) {
  if (loading) {
    return (
      <p className="mx-4 py-8 text-center text-sm text-white/45">در حال بارگذاری...</p>
    );
  }

  if (error) {
    return (
      <p className="mx-4 rounded-xl border border-danger/30 bg-danger/10 py-6 text-center text-sm text-danger">
        {error}
      </p>
    );
  }

  if (referrals.length === 0) {
    return (
      <p className="mx-4 rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-white/45">
        هنوز کسی با لینک دعوت شما ثبت‌نام نکرده است.
      </p>
    );
  }

  return (
    <div className="mx-4 space-y-2">
      {referrals.map((item, i) => (
        <motion.div
          key={`${item.firstName}-${item.lastName}-${item.registeredAtLabel}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
          className="glass-surface flex items-center gap-3 rounded-2xl p-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
            <Users className="size-4 text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {item.firstName} {item.lastName}
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">
              تاریخ ثبت‌نام: {item.registeredAtLabel}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
