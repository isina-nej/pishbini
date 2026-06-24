const SW_PATH = "/sw.js";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return key?.trim() || null;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

export async function getPushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export type PushBrowserState = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

export async function getPushBrowserState(): Promise<PushBrowserState> {
  if (!isPushSupported()) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }

  const permission = Notification.permission;
  let subscribed = false;

  if (permission === "granted" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      subscribed = (await registration.pushManager.getSubscription()) !== null;
    } catch {
      subscribed = false;
    }
  }

  return { supported: true, permission, subscribed };
}

export async function setPushOptInOnServer(enabled: boolean): Promise<boolean> {
  const res = await fetch("/api/me/push-preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  return res.ok;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return registerServiceWorker();
}

async function syncSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return false;
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });

  return res.ok;
}

async function createBrowserPushSubscription(
  registration: ServiceWorkerRegistration,
  forceNew = false
): Promise<PushSubscription | null> {
  const vapidKey = getVapidPublicKey();
  if (!vapidKey) return null;

  const existing = await registration.pushManager.getSubscription();
  if (existing && forceNew) {
    try {
      await existing.unsubscribe();
    } catch {
      /* ignore */
    }
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
  }

  return subscription;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !getVapidPublicKey()) return null;

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;

  await navigator.serviceWorker.ready;

  const subscription = await createBrowserPushSubscription(registration);
  if (!subscription) return null;

  const synced = await syncSubscriptionToServer(subscription);
  return synced ? subscription : null;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    /* ignore */
  }
}

export async function syncPushSubscriptionIfGranted(): Promise<void> {
  if (!isPushSupported() || !getVapidPublicKey()) return;
  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
}

export async function enablePushFlow(): Promise<{
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  ok: boolean;
}> {
  if (!isPushSupported()) {
    return { permission: "unsupported", subscribed: false, ok: false };
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { permission, subscribed: false, ok: false };
    }
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return { permission, subscribed: false, ok: false };
  }

  await navigator.serviceWorker.ready;

  let subscription: PushSubscription | null = null;
  try {
    subscription = await createBrowserPushSubscription(registration);
    if (!subscription) {
      subscription = await createBrowserPushSubscription(registration, true);
    }
  } catch {
    try {
      subscription = await createBrowserPushSubscription(registration, true);
    } catch {
      subscription = null;
    }
  }

  if (!subscription) {
    return { permission, subscribed: false, ok: false };
  }

  const synced = await syncSubscriptionToServer(subscription);
  if (!synced) {
    return { permission, subscribed: false, ok: false };
  }

  await setPushOptInOnServer(true);

  const { setPushOptInLocal } = await import("@/lib/push-prompt-events");
  setPushOptInLocal(true);

  const state = await getPushBrowserState();
  return {
    permission: state.permission,
    subscribed: state.subscribed,
    ok: state.subscribed,
  };
}

export async function disablePushFlow(): Promise<void> {
  const { setPushOptInLocal } = await import("@/lib/push-prompt-events");
  setPushOptInLocal(false);
  await unsubscribeFromPush();
  await setPushOptInOnServer(false);
}
