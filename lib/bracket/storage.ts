import { BRACKET_DRAFT_KEY, BRACKET_DRAFT_VERSION } from "./constants";
import { sanitizePicks } from "./progression";
import type { BracketDraft, BracketPicks, BracketTree } from "./types";

export function loadDraft(tree: BracketTree | null): BracketPicks {
  if (typeof window === "undefined" || !tree) return {};
  try {
    const raw = localStorage.getItem(BRACKET_DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BracketDraft;
    if (parsed.version !== BRACKET_DRAFT_VERSION || !parsed.picks) return {};
    return sanitizePicks(parsed.picks, tree);
  } catch {
    return {};
  }
}

export function saveDraft(picks: BracketPicks): void {
  if (typeof window === "undefined") return;
  const draft: BracketDraft = {
    version: BRACKET_DRAFT_VERSION,
    picks,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(BRACKET_DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BRACKET_DRAFT_KEY);
}

export function hasRestoredDraft(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BRACKET_DRAFT_KEY) !== null;
}
