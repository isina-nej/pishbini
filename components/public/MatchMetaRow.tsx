"use client";

import { formatPersianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { MatchPredictionTimer } from "@/components/public/MatchPredictionTimer";

type Props = {
  startTime: string;
  className?: string;
  tourTarget?: boolean;
};

export function MatchMetaRow({ startTime, className, tourTarget }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl px-3 py-2 glass-surface",
        className
      )}
    >
      <div className="min-w-0 text-right">
        <p className="text-[10px] leading-none text-white/45">شروع بازی</p>
        <p className="mt-1 truncate text-xs font-medium text-white/80">
          {formatPersianDateTime(startTime)}
        </p>
      </div>
      <div className="shrink-0" data-tour={tourTarget ? "match-timer" : undefined}>
        <MatchPredictionTimer startTime={startTime} variant="compact" />
      </div>
    </div>
  );
}
