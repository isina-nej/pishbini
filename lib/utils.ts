import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NODE_ENV === "production" && !url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  return url ?? "http://localhost:3000";
}

export function getReferralLink(code: string): string {
  return `${getAppUrl()}/ref/${code}`;
}
