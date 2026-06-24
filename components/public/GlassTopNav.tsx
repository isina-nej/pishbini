"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SESSION_UPDATED_EVENT } from "@/lib/session-events";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "loggedIn"; firstName: string; lastName: string; phone: string };

export const GLASS_TOP_NAV_HEIGHT = "3rem";

async function fetchSession(): Promise<SessionState> {
  const res = await fetch("/api/me/session", {
    credentials: "include",
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.loggedIn) return { status: "guest" };

  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  return {
    status: "loggedIn",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    phone,
  };
}

export function GlassTopNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  const loadSession = useCallback(() => {
    fetchSession()
      .then(setSession)
      .catch(() => setSession({ status: "guest" }));
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession, pathname]);

  useEffect(() => {
    const onFocus = () => loadSession();
    const onSessionUpdated = () => loadSession();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener(SESSION_UPDATED_EVENT, onSessionUpdated);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener(SESSION_UPDATED_EVENT, onSessionUpdated);
    };
  }, [loadSession]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[430px]",
        "glass-surface rounded-b-2xl border-x-0 border-t-0",
        "px-4 pb-2 pt-[max(0.4rem,env(safe-area-inset-top))]"
      )}
      data-tour="home-header"
    >
      {session.status === "loading" ? (
        <div className="flex flex-col items-end gap-1">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/15" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/20" />
        </div>
      ) : session.status === "loggedIn" ? (
        <div className="flex flex-col items-end gap-0.5">
          {session.phone ? (
            <p
              dir="ltr"
              className="text-xs font-semibold tabular-nums text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]"
            >
              {session.phone}
            </p>
          ) : null}
          <p className="text-xs font-bold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.75)]">
            سلام، {session.firstName} {session.lastName}!
          </p>
        </div>
      ) : (
        <p className="text-right text-xs font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.75)]">
          به پیش‌بینی جام جهانی خوش آمدید
        </p>
      )}
    </header>
  );
}
