import { BottomNav } from "@/components/public/BottomNav";
import { PageAccessProvider } from "@/components/public/PageAccessProvider";
import { ReferralBanner } from "@/components/public/ReferralBanner";
import { PrizesPageClient } from "./PrizesPageClient";

export default function PrizesPage() {
  return (
    <PageAccessProvider>
      <ReferralBanner />
      <PrizesPageClient />
      <BottomNav />
    </PageAccessProvider>
  );
}
