"use client";

import type { ReactNode } from "react";
import type { PageAccessSettings } from "@/lib/page-access.shared";
import { PageAccessProvider } from "./PageAccessProvider";

export function AppProviders({
  children,
  initialPageAccess,
}: {
  children: ReactNode;
  initialPageAccess?: PageAccessSettings;
}) {
  return (
    <PageAccessProvider initialSettings={initialPageAccess}>
      {children}
    </PageAccessProvider>
  );
}
