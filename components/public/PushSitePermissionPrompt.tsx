"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  enablePushFlow,
  getVapidPublicKey,
  isPushSupported,
} from "@/lib/push-client";
import {
  markPushSitePermissionAsked,
  wasPushSitePermissionAsked,
} from "@/lib/push-prompt-events";

const SPLASH_DONE_KEY = "wc_splash_first_visit_done";
const SITE_PROMPT_DELAY_MS = 3500;

function isSplashDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SPLASH_DONE_KEY) === "1";
}

export function PushSitePermissionPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || !isHome) {
      setVisible(false);
      return;
    }

    if (
      !isPushSupported() ||
      !getVapidPublicKey() ||
      Notification.permission !== "default" ||
      wasPushSitePermissionAsked()
    ) {
      return;
    }

    let cancelled = false;
    let delayId: number | undefined;
    let pollId: number | undefined;

    const tryShow = () => {
      if (cancelled) return;
      if (!isSplashDone()) return;
      setVisible(true);
    };

    if (isSplashDone()) {
      delayId = window.setTimeout(tryShow, SITE_PROMPT_DELAY_MS);
    } else {
      pollId = window.setInterval(() => {
        if (isSplashDone()) {
          if (pollId) window.clearInterval(pollId);
          delayId = window.setTimeout(tryShow, SITE_PROMPT_DELAY_MS);
        }
      }, 400);
    }

    return () => {
      cancelled = true;
      if (delayId) window.clearTimeout(delayId);
      if (pollId) window.clearInterval(pollId);
    };
  }, [isHome, isAdmin]);

  const finish = () => {
    markPushSitePermissionAsked();
    setVisible(false);
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      await enablePushFlow();
    } finally {
      setBusy(false);
      finish();
    }
  };

  const handleDismiss = () => {
    finish();
  };

  const shouldRender = visible && !isAdmin && isHome;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed inset-x-0 z-[45] mx-auto w-full max-w-[430px] px-3",
            "top-[calc(var(--glass-top-nav-height)+max(0.5rem,env(safe-area-inset-top))+0.25rem)]"
          )}
        >
          <div
            className={cn(
              "rounded-2xl border border-white/20 px-4 py-3 shadow-xl backdrop-blur-md",
              "bg-[#0a0c14]/95"
            )}
          >
            <p className="text-sm font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
              اعلان نتیجه بازی‌ها
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              برای دریافت نتیجه پیش‌بینی‌ها و بازی‌های جدید، اعلان مرورگر را فعال کنید.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy}
                className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-[#10111f] disabled:opacity-60"
              >
                {busy ? "در حال فعال‌سازی…" : "فعال‌سازی"}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-xl px-3 py-2.5 text-xs font-medium text-white/60"
              >
                بعداً
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
