import { redirect } from "next/navigation";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { ProfilePageClient } from "@/components/public/ProfilePageClient";
import { resolveUserIdFromCookies } from "@/lib/me-user";

export default async function ProfilePage() {
  const userId = await resolveUserIdFromCookies();
  if (!userId) redirect("/login?from=/profile");

  return (
    <PublicPageShell pageId="profile">
      <ProfilePageClient />
    </PublicPageShell>
  );
}
