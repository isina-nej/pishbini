"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { setStoredReferralCode } from "@/lib/predictions-storage";
import { LoadingState } from "@/components/public/LoadingState";

export default function RefPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code ?? "").toUpperCase();

  useEffect(() => {
    if (code) {
      setStoredReferralCode(code);
    }
    router.replace("/");
  }, [code, router]);

  return <LoadingState message="در حال انتقال..." />;
}
