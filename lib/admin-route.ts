import { NextResponse } from "next/server";
import { AdminAuthError, adminUnauthorizedResponse } from "@/lib/auth-admin";

export function handleAdminRouteError(err: unknown, fallbackMessage: string): Response {
  if (err instanceof AdminAuthError) {
    return adminUnauthorizedResponse();
  }
  console.error(err);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
