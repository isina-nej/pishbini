import { PublicPageShell } from "@/components/public/PublicPageShell";
import { ProfileReferralsPageClient } from "@/components/public/ProfileReferralsPageClient";

export default function ProfileReferralsPage() {
  return (
    <PublicPageShell pageId="profile">
      <ProfileReferralsPageClient />
    </PublicPageShell>
  );
}
