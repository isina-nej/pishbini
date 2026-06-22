import { BracketPageClient } from "@/components/bracket/BracketPageClient";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export default function BracketPage() {
  return (
    <PublicPageShell pageId="bracket" showNav={false}>
      <BracketPageClient />
    </PublicPageShell>
  );
}
