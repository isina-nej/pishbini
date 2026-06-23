import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PrizesPageClient } from "./PrizesPageClient";

export default function PrizesPage() {
  return (
    <PublicPageShell pageId="prizes">
      <PrizesPageClient />
    </PublicPageShell>
  );
}
