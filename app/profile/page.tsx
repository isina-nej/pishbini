import { PublicPageShell } from "@/components/public/PublicPageShell";
import { ProfilePageClient } from "@/components/public/ProfilePageClient";

export default function ProfilePage() {
  return (
    <PublicPageShell pageId="profile">
      <ProfilePageClient />
    </PublicPageShell>
  );
}
