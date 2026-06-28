import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRODUCTION_APP_URL = "https://wc.pishrosarmaye.com";

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }
  return "http://localhost:3000";
}

export function getReferralLink(code: string): string {
  return `${getAppUrl()}/ref/${code}`;
}

export function getPredictionOutcomeStyles(isCorrect: boolean | null): string {
  if (isCorrect === true) {
    return "border border-success/30 bg-success/10 backdrop-blur-md";
  }
  if (isCorrect === false) {
    return "border border-danger/30 bg-danger/10 backdrop-blur-md";
  }
  return "border border-warning/30 bg-warning/10 backdrop-blur-md";
}
