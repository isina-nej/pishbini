import { Suspense } from "react";
import { BracketPageClient } from "@/components/bracket/BracketPageClient";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export default function BracketPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <PublicPageShell pageId="bracket" showNav={false}>
        <BracketPageClient />
      </PublicPageShell>
    </Suspense>
  );
}
