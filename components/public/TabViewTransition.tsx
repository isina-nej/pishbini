"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function TabViewTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="tab-view-content min-h-dvh">
      {children}
    </div>
  );
}
