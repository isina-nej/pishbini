"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  disablePushFlow,
  enablePushFlow,
  getPushBrowserState,
  getVapidPublicKey,
  isPushSupported,
  syncPushSubscriptionIfGranted,
} from "@/lib/push-client";
import { SESSION_UPDATED_EVENT } from "@/lib/session-events";

type Props = {
  pushOptIn: boolean;
  onPushOptInChange: (enabled: boolean) => void;
};

export function PushNotificationSettings({ pushOptIn, onPushOptInChange }: Props) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const state = await getPushBrowserState();
    setPermission(state.permission);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pushOptIn]);

  useEffect(() => {
    const onSession = () => {
      if (pushOptIn && Notification.permission === "granted") {
        void syncPushSubscriptionIfGranted();
      }
    };
    window.addEventListener(SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, onSession);
  }, [pushOptIn]);

  if (!isPushSupported() || !getVapidPublicKey()) {
    return null;
  }

  const denied = permission === "denied";
  const switchOn = pushOptIn && !denied;

  const handleToggle = async () => {
    if (busy || denied) return;
    setError(null);
    setBusy(true);
    try {
      if (switchOn) {
        await disablePushFlow();
        onPushOptInChange(false);
      } else {
        const result = await enablePushFlow();
        setPermission(result.permission);
        if (result.permission === "granted") {
          onPushOptInChange(true);
        } else if (result.permission === "denied") {
          setError("مجوز اعلان در مرورگر مسدود است. از تنظیمات سایت آن را فعال کنید.");
          onPushOptInChange(false);
        } else {
          setError("فعال‌سازی اعلان لغو شد.");
        }
      }
      await refresh();
    } catch {
      setError("خطا در تغییر تنظیمات اعلان.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card mx-4 mb-4 p-4" data-tour="profile-push">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              switchOn ? "bg-primary/15 text-primary" : "bg-white/10 text-white/45"
            )}
          >
            {switchOn ? <Bell className="size-5" /> : <BellOff className="size-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">اعلان نتیجه بازی‌ها</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">
              {denied
                ? "مجوز اعلان در مرورگر خاموش است."
                : switchOn
                  ? "اعلان‌ها فعال است."
                  : "اعلان‌ها خاموش است."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={switchOn}
          aria-label="اعلان نتیجه بازی‌ها"
          disabled={busy || denied}
          onClick={handleToggle}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors",
            switchOn ? "bg-primary" : "bg-white/20",
            (busy || denied) && "opacity-50"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
              switchOn ? "right-0.5" : "left-0.5"
            )}
          />
        </button>
      </div>
      {denied && (
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          برای فعال‌سازی، از تنظیمات مرورگر مجوز اعلان این سایت را روشن کنید.
        </p>
      )}
      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
    </div>
  );
}
