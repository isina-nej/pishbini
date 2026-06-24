"use client";

import type { ReactNode } from "react";
import type { PageAccessSettings } from "@/lib/page-access.shared";
import { PageAccessProvider } from "./PageAccessProvider";
import { PushNotificationPrompt } from "./PushNotificationPrompt";
import { PushSitePermissionPrompt } from "./PushSitePermissionPrompt";

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
      <PushSitePermissionPrompt />
      <PushNotificationPrompt />
    </PageAccessProvider>
  );
}
