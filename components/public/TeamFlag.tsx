"use client";

import { cn } from "@/lib/utils";
import { localFlagPath } from "@/lib/team-flag";

type FlagFit = "cover" | "contain" | "stretch";

type TeamFlagProps = {
  src?: string;
  code?: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  loading?: "eager" | "lazy";
  /** How the flag fills its box */
  fit?: FlagFit;
};

const FIT_CLASS: Record<FlagFit, string> = {
  cover: "team-flag--cover",
  contain: "team-flag--contain",
  stretch: "team-flag--stretch",
};

export function TeamFlag({
  code,
  alt = "",
  className,
  fill,
  fit = "cover",
}: TeamFlagProps) {
  if (!code) {
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-white/10 text-[10px] font-bold text-white/50",
          fill && "absolute inset-0",
          className
        )}
        aria-hidden
      >
        ?
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={alt || code}
      className={cn(
        "team-flag",
        fill ? "team-flag--fill" : "team-flag--inline",
        FIT_CLASS[fit],
        className
      )}
      style={{ backgroundImage: `url(${localFlagPath(code)})` }}
    />
  );
}
