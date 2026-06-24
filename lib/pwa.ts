export const PWA_SW_PATH = "/sw.js";
export const PWA_INSTALL_DISMISS_KEY = "wc_pwa_install_dismissed";
export const PWA_IOS_HINT_DISMISS_KEY = "wc_pwa_ios_hint_dismissed";

export function isPushCapableBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  );
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isClassicIos = /iphone|ipad|ipod/i.test(ua);
  const isIpadOs =
    /macintosh/i.test(ua) &&
    typeof document !== "undefined" &&
    "ontouchend" in document;
  return isClassicIos || isIpadOs;
}

/** @deprecated Use isIosDevice */
export function isIosSafari(): boolean {
  return isIosDevice();
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

export function needsIosInstallHint(): boolean {
  return isIosDevice() && !isStandalonePwa();
}

export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushCapableBrowser()) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) {
      void existing.update();
      return existing;
    }
    return navigator.serviceWorker.register(PWA_SW_PATH, {
      scope: "/",
      type: "classic",
      updateViaCache: "none",
    });
  } catch {
    return null;
  }
}
