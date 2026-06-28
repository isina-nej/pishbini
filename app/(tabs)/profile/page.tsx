import { Suspense } from "react";
import { ProfilePageClient } from "@/components/public/ProfilePageClient";
import { LoadingState } from "@/components/public/LoadingState";

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProfilePageClient />
    </Suspense>
  );
}
