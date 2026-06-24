"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "loggedIn"; firstName: string; maskedPhone: string };

export const GLASS_TOP_NAV_HEIGHT = "4.5rem";

export function GlassTopNav() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/me/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn) {
          setSession({
            status: "loggedIn",
            firstName: data.firstName ?? "",
            maskedPhone: data.maskedPhone ?? "",
          });
        } else {
          setSession({ status: "guest" });
        }
      })
      .catch(() => setSession({ status: "guest" }));
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[430px]",
        "glass-surface rounded-b-2xl border-x-0 border-t-0",
        "px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      )}
      data-tour="home-header"
    >
      {session.status === "loading" ? (
        <div className="space-y-2">
          <div className="mx-auto h-3 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-white/15" />
        </div>
      ) : session.status === "loggedIn" ? (
        <div className="text-center">
          <p dir="ltr" className="text-xs font-medium text-white/55">
            {session.maskedPhone}
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            سلام، {session.firstName}!
          </p>
        </div>
      ) : (
        <p className="text-center text-sm font-bold text-white">
          به پیش‌بینی جام جهانی خوش آمدید
        </p>
      )}
    </header>
  );
}
