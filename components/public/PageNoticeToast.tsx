"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

const AUTO_DISMISS_MS = 5000;

export function PageNoticeToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4"
        >
          <div className="pointer-events-auto flex w-full max-w-[390px] items-start gap-3 rounded-2xl border border-primary/30 bg-[#10111f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 500, damping: 22 }}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15"
            >
              <Info className="size-5 text-primary" />
            </motion.div>
            <p className="flex-1 pt-1 text-sm leading-relaxed text-white/90">{message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
