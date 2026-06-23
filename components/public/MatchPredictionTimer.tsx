"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatCountdownFa(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const part = (n: number) =>
    n.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false });
  return `${part(h)}:${part(m)}:${part(s)}`;
}

function secondsUntil(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

type Props = {
  startTime: string;
  className?: string;
};

export function MatchPredictionTimer({ startTime, className }: Props) {
  const [remaining, setRemaining] = useState(() => secondsUntil(startTime));

  useEffect(() => {
    const tick = () => setRemaining(secondsUntil(startTime));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startTime]);

  const urgent = remaining > 0 && remaining < 3600;
  const ended = remaining === 0;

  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <span className="text-[10px] text-white/45">
        {ended ? "مهلت پیش‌بینی به پایان رسید" : "تا پایان مهلت پیش‌بینی و شروع بازی"}
      </span>
      <span
        className={cn(
          "text-base font-bold tabular-nums tracking-wide",
          ended ? "text-white/35" : urgent ? "text-warning" : "text-primary"
        )}
        dir="ltr"
      >
        {ended ? "۰۰:۰۰:۰۰" : formatCountdownFa(remaining)}
      </span>
    </div>
  );
}
