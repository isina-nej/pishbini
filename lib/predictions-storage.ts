import { PredictionChoice } from "@/generated/prisma";

const STORAGE_KEY = "wc_predictions";
const REFERRAL_KEY = "wc_referral_code";

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

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRAL_KEY) ?? null;
}

export function setStoredReferralCode(code: string) {
  localStorage.setItem(REFERRAL_KEY, code);
  document.cookie = `wc_referral=${code}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}
