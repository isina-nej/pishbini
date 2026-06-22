"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { localFlagPath } from "@/lib/team-flag";

type TeamFlagProps = {
  src: string;
  code?: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  loading?: "eager" | "lazy";
};

export function TeamFlag({
  src,
  code,
  alt = "",
  className,
  fill,
  loading = "lazy",
}: TeamFlagProps) {
  const [failed, setFailed] = useState(false);
  const resolved = code ? localFlagPath(code) : src;

  if (failed || !resolved) {
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-white/10 text-[10px] font-bold text-white/50",
          fill && "absolute inset-0",
          className
        )}
        aria-hidden
      >
        {code?.slice(0, 3) ?? "?"}
      </span>
    );
  }

  const img = (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(
        "object-cover",
        fill ? "absolute inset-0 h-full w-full" : "h-full w-full",
        className
      )}
    />
  );

  if (fill) {
    return <span className="relative block h-full w-full overflow-hidden">{img}</span>;
  }

  return img;
}
