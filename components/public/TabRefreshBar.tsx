"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTabRefreshState } from "@/lib/tab-refresh-context";

export function TabRefreshBar() {
  const { refreshing } = useTabRefreshState();
  const reduceMotion = useReducedMotion();

  if (!refreshing) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto max-w-[430px]"
      aria-hidden
    >
      <motion.div
        className="h-0.5 origin-right bg-gradient-to-l from-primary via-secondary to-primary"
        initial={reduceMotion ? false : { scaleX: 0, opacity: 0.6 }}
        animate={{ scaleX: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { scaleX: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }
        }
      />
    </div>
  );
}
