"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function useViewTransitionSupported() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof document.startViewTransition === "function" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  return supported;
}

function getSlideOffset(): number {
  const nav = document.documentElement.dataset.tabNav;
  if (nav === "nav-forward") return -28;
  if (nav === "nav-back") return 28;
  return 0;
}

export function TabViewTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const vtSupported = useViewTransitionSupported();
  const useNativeTransition = vtSupported && !reduceMotion;

  if (useNativeTransition) {
    return (
      <div key={pathname} className="tab-view-content min-h-dvh">
        {children}
      </div>
    );
  }

  const offset = typeof document !== "undefined" ? getSlideOffset() : 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="tab-view-content min-h-dvh"
        initial={reduceMotion ? false : { opacity: 0, x: -offset, scale: 0.985, filter: "blur(4px)" }}
        animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, x: offset, scale: 0.985, filter: "blur(4px)" }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
