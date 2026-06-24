export const PUSH_PROMPT_DISMISS_KEY = "wc_push_prompt_dismissed";
export const SHOW_PUSH_PROMPT_EVENT = "wc:show-push-prompt";

export function notifyShowPushPrompt() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(PUSH_PROMPT_DISMISS_KEY) === "1") return;
  window.dispatchEvent(new Event(SHOW_PUSH_PROMPT_EVENT));
}
