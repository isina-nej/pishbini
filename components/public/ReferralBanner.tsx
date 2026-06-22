"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import { getStoredReferralCode } from "@/lib/predictions-storage";

export function ReferralBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = getStoredReferralCode();
    if (!code) return;

    fetch(`/api/referral/validate?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid && data.referrerFirstName) {
          setMessage(`از طریق دعوت ${data.referrerFirstName} وارد شده‌اید`);
        } else if (data.valid) {
          setMessage("لینک دعوت شما ثبت شد");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5"
        >
          <UserPlus className="size-4 shrink-0 text-primary" />
          <p className="text-xs text-white/80">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
