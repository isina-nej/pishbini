export const SESSION_UPDATED_EVENT = "wc-session-updated";

export function notifySessionUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}
