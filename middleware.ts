import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminSessionTokenPlausible } from "@/lib/admin-session-edge";
import {
  normalizeReferralCode,
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_COOKIE_NAME,
} from "@/lib/referral";

function attachReferralCookie(response: NextResponse, code: string) {
  response.cookies.set(REFERRAL_COOKIE_NAME, code, {
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const refPathMatch = pathname.match(/^\/ref\/([^/]+)\/?$/);
  if (refPathMatch) {
    const code = normalizeReferralCode(refPathMatch[1]);
    const response = NextResponse.redirect(new URL("/", request.url));
    if (code) attachReferralCookie(response, code);
    return response;
  }

  if (pathname === "/") {
    const refQuery = request.nextUrl.searchParams.get("ref");
    const code = refQuery ? normalizeReferralCode(refQuery) : null;
    if (code) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("ref");
      const response = NextResponse.redirect(url);
      attachReferralCookie(response, code);
      return response;
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("admin_session")?.value;
    if (!token || !isAdminSessionTokenPlausible(token)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ref/:path*", "/"],
};
