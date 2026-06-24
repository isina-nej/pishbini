"use client";

import { useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PhoneAuthFlow } from "@/components/public/PhoneAuthFlow";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
};

export function AuthOtpSheet({
  open,
  onClose,
  onSuccess,
  title,
  subtitle,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="بستن"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-labelledby={titleId}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="relative z-10 w-full max-w-[430px] rounded-t-[1.75rem] border border-white/10 glass-panel p-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-bold">
                {title ?? "ورود به حساب"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10"
                aria-label="بستن"
              >
                <X className="size-5" />
              </button>
            </div>
            <PhoneAuthFlow
              variant="sheet"
              title=""
              subtitle={subtitle}
              onSuccess={onSuccess}
              onCancel={onClose}
              showCancel
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
