"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isIosSafari,
  isStandalonePwa,
  PWA_INSTALL_DISMISS_KEY,
  PWA_IOS_HINT_DISMISS_KEY,
  registerPwaServiceWorker,
} from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaSupport() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isAdmin || isStandalonePwa()) return;
    void registerPwaServiceWorker();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || isStandalonePwa()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === "1") return;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || isStandalonePwa()) return;
    if (!isIosSafari()) return;
    if (localStorage.getItem(PWA_IOS_HINT_DISMISS_KEY) === "1") return;

    const timer = window.setTimeout(() => setShowIosHint(true), 4000);
    return () => window.clearTimeout(timer);
  }, [isAdmin]);

  const dismissInstall = useCallback(() => {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "1");
    setShowInstall(false);
    setInstallEvent(null);
  }, []);

  const dismissIosHint = useCallback(() => {
    localStorage.setItem(PWA_IOS_HINT_DISMISS_KEY, "1");
    setShowIosHint(false);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setShowInstall(false);
        setInstallEvent(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  if (isAdmin || isStandalonePwa()) return null;

  return (
    <>
      {showInstall && installEvent && (
        <div
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-[430px] px-4"
          role="region"
          aria-label="نصب اپلیکیشن"
        >
          <div className="glass-card flex items-center gap-3 border border-white/15 p-3 shadow-lg">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Download className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">نصب روی گوشی</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">
                دسترسی سریع‌تر و تجربه تمام‌صفحه
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-bg"
            >
              {installing ? "..." : "نصب"}
            </button>
            <button
              type="button"
              onClick={dismissInstall}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:bg-white/10"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {showIosHint && !showInstall && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-[430px] px-4"
          )}
          role="region"
          aria-label="راهنمای نصب iOS"
        >
          <div className="glass-card flex items-start gap-3 border border-white/15 p-3 shadow-lg">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
              <Share className="size-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">افزودن به صفحه اصلی</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">
                در Safari دکمه اشتراک‌گذاری را بزنید و «Add to Home Screen» را انتخاب کنید.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissIosHint}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:bg-white/10"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
