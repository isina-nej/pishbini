export const PUSH_PROMPT_DISMISS_KEY = "wc_push_prompt_dismissed";
export const PUSH_SITE_PERMISSION_ASKED_KEY = "wc_push_site_permission_asked";
export const PUSH_OPT_IN_LOCAL_KEY = "wc_push_opt_in_local";
export const SHOW_PUSH_PROMPT_EVENT = "wc:show-push-prompt";

export function isPushOptInLocal(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(PUSH_OPT_IN_LOCAL_KEY);
  if (stored === null) return true;
  return stored === "1";
}

export function setPushOptInLocal(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_OPT_IN_LOCAL_KEY, enabled ? "1" : "0");
}

export function markPushSitePermissionAsked() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_SITE_PERMISSION_ASKED_KEY, "1");
}

export function wasPushSitePermissionAsked(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(PUSH_SITE_PERMISSION_ASKED_KEY) === "1";
}

export function notifyShowPushPrompt() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(PUSH_PROMPT_DISMISS_KEY) === "1") return;
  if (!wasPushSitePermissionAsked()) return;
  window.dispatchEvent(new Event(SHOW_PUSH_PROMPT_EVENT));
}
