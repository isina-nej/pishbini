"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getPushPermission,
  getVapidPublicKey,
  isPushSupported,
  subscribeToPush,
  syncPushSubscriptionIfGranted,
} from "@/lib/push-client";
import { SESSION_UPDATED_EVENT } from "@/lib/session-events";

const DISMISS_KEY = "wc_push_prompt_dismissed";

type SessionState = "loading" | "guest" | "loggedIn";

export function PushNotificationPrompt() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>("loading");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    if (isPushSupported()) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const loadSession = useCallback(() => {
    fetch("/api/me/session", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSession(data.loggedIn ? "loggedIn" : "guest"))
      .catch(() => setSession("guest"));
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession, pathname]);

  useEffect(() => {
    const onSessionUpdated = () => loadSession();
    window.addEventListener(SESSION_UPDATED_EVENT, onSessionUpdated);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, onSessionUpdated);
  }, [loadSession]);

  useEffect(() => {
    if (session !== "loggedIn" || permission !== "granted") return;
    void syncPushSubscriptionIfGranted();
  }, [session, permission]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const sub = await subscribeToPush();
      const next = await getPushPermission();
      setPermission(next);
      if (sub) {
        setDismissed(true);
        localStorage.setItem(DISMISS_KEY, "1");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (
    isAdmin ||
    !isPushSupported() ||
    !getVapidPublicKey() ||
    session !== "loggedIn" ||
    permission === "granted" ||
    permission === "denied" ||
    dismissed
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50",
        "mx-auto w-full max-w-[430px] px-3"
      )}
    >
      <div className="rounded-2xl px-4 py-3 glass-panel">
        <p className="text-sm font-bold text-white">اعلان نتیجه بازی‌ها</p>
        <p className="mt-1 text-xs leading-relaxed text-white/65">
          با فعال‌سازی اعلان‌ها، نتیجه پیش‌بینی‌ها و بازی‌های جدید را دریافت کنید.
          در iOS ممکن است نیاز به افزودن سایت به صفحهٔ اصلی باشد.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-[#10111f] disabled:opacity-60"
          >
            {busy ? "در حال فعال‌سازی…" : "فعال‌سازی"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl px-3 py-2 text-xs font-medium text-white/55"
          >
            بعداً
          </button>
        </div>
      </div>
    </div>
  );
}
