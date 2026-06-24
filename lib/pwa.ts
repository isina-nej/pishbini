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

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isWebkit = /webkit/i.test(ua);
  const isChromeIos = /crios/i.test(ua);
  return isIos && isWebkit && !isChromeIos;
}

export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushCapableBrowser()) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) return existing;
    return navigator.serviceWorker.register(PWA_SW_PATH, { scope: "/" });
  } catch {
    return null;
  }
}
