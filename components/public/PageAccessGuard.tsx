"use client";

import { useEffect, type ReactNode } from "react";
import type { PageId } from "@/lib/page-access.shared";
import { usePageAccess } from "./PageAccessProvider";

export function PageAccessGuard({
  pageId,
  children,
}: {
  pageId: PageId;
  children: ReactNode;
}) {
  const { loaded, settings, showNotice } = usePageAccess();
  const config = settings[pageId];
  const enabled = config?.enabled !== false;

  useEffect(() => {
    if (loaded && !enabled) {
      showNotice(config.message);
    }
  }, [loaded, enabled, config.message, showNotice]);

  if (!loaded) return <>{children}</>;

  if (!enabled) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 pb-24 pt-12 text-center">
        <p className="text-sm text-white/40">این بخش در حال حاضر غیرفعال است</p>
      </div>
    );
  }

  return <>{children}</>;
}
