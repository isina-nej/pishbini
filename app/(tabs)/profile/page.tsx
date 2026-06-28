import { Suspense } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { ProfilePageClient } from "@/components/public/ProfilePageClient";
import { LoadingState } from "@/components/public/LoadingState";

export default function ProfilePage() {
  return (
    <PublicPageShell pageId="profile">
      <Suspense fallback={<LoadingState />}>
        <ProfilePageClient />
      </Suspense>
    </PublicPageShell>
  );
}
