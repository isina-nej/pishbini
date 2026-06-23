"use client";

import { useEffect } from "react";
import { useTourPageReadySetter } from "./ProductTourProvider";

/** صفحاتی که دادهٔشان async لود می‌شود باید این را mount کنند. */
export function TourPageReady({ ready }: { ready: boolean }) {
  const setReady = useTourPageReadySetter();
  useEffect(() => {
    setReady(ready);
    return () => setReady(true);
  }, [ready, setReady]);
  return null;
}
