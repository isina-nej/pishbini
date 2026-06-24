"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  enablePushFlow,
  getVapidPublicKey,
  isPushSupported,
  syncPushSubscriptionIfGranted,
} from "@/lib/push-client";
import {
  PUSH_PROMPT_DISMISS_KEY,
  SHOW_PUSH_PROMPT_EVENT,
  wasPushSitePermissionAsked,
} from "@/lib/push-prompt-events";
import { SESSION_UPDATED_EVENT } from "@/lib/session-events";

export function PushNotificationPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [busy, setBusy] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isPushSupported()) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    const onShow = () => setVisible(true);
    window.addEventListener(SHOW_PUSH_PROMPT_EVENT, onShow);
    return () => window.removeEventListener(SHOW_PUSH_PROMPT_EVENT, onShow);
  }, []);

  useEffect(() => {
    const onSessionUpdated = () => {
      if (Notification.permission === "granted") {
        void syncPushSubscriptionIfGranted();
      }
    };
    window.addEventListener(SESSION_UPDATED_EVENT, onSessionUpdated);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, onSessionUpdated);
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    void syncPushSubscriptionIfGranted();
    setVisible(false);
  }, [permission]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const result = await enablePushFlow();
      setPermission(result.permission);
      if (result.ok) {
        setVisible(false);
        localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, "1");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, "1");
  }, []);

  const shouldRender =
    !isAdmin &&
    isPushSupported() &&
    getVapidPublicKey() &&
    permission === "default" &&
    wasPushSitePermissionAsked() &&
    visible;

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
              با فعال‌سازی اعلان‌ها، نتیجه پیش‌بینی‌ها و بازی‌های جدید را دریافت کنید.
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
