import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminSessionTokenPlausible } from "@/lib/admin-session-edge";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("admin_session")?.value;
    if (!token || !isAdminSessionTokenPlausible(token)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
