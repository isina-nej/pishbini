import { PredictionChoice } from "@/generated/prisma";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_STORAGE_KEY,
  normalizeReferralCode,
} from "@/lib/referral";

const STORAGE_KEY = "wc_predictions";

export type StoredPrediction = {
  matchId: string;
  prediction: PredictionChoice;
};

export function getStoredPredictions(): StoredPrediction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredPredictions(predictions: StoredPrediction[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
}

export function clearStoredPredictions() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function readReferralCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  return normalizeReferralCode(decodeURIComponent(match[1]));
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  const fromStorage = localStorage.getItem(REFERRAL_STORAGE_KEY);
  if (fromStorage) {
    const normalized = normalizeReferralCode(fromStorage);
    if (normalized) return normalized;
  }

  const fromCookie = readReferralCookie();
  if (fromCookie) {
    localStorage.setItem(REFERRAL_STORAGE_KEY, fromCookie);
    return fromCookie;
  }

  return null;
}

export function setStoredReferralCode(code: string) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return;
  localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
  document.cookie = `${REFERRAL_COOKIE_NAME}=${normalized}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearStoredReferralCode() {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
