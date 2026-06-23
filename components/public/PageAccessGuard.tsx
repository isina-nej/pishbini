"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  getFirstAccessiblePage,
  PAGE_ROUTES,
  type PageId,
} from "@/lib/page-access.shared";
import { usePageAccess } from "./PageAccessProvider";

export function PageAccessGuard({
  pageId,
  children,
}: {
  pageId: PageId;
  children: ReactNode;
}) {
  const router = useRouter();
  const { loaded, settings, showNotice, isPageVisible } = usePageAccess();
  const config = settings[pageId];
  const visible = isPageVisible(pageId);

  useEffect(() => {
    if (!loaded || visible) return;
    showNotice(config.message);
    const fallback = getFirstAccessiblePage(settings);
    if (fallback && fallback !== pageId) {
      router.replace(PAGE_ROUTES[fallback]);
    }
  }, [loaded, visible, config.message, showNotice, settings, pageId, router]);

  if (!loaded) return <>{children}</>;

  if (!visible) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 pb-24 pt-12 text-center">
        <p className="text-sm text-white/40">این بخش در حال حاضر در دسترس نیست</p>
      </div>
    );
  }

  return <>{children}</>;
}
