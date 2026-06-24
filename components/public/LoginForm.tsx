"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PhoneAuthFlow } from "@/components/public/PhoneAuthFlow";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/profile";

  useEffect(() => {
    fetch("/api/me/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace(redirectTo);
          router.refresh();
        }
      })
      .catch(() => {});
  }, [router, redirectTo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <PhoneAuthFlow
        title=""
        subtitle="با شماره موبایل و کد تأیید وارد شوید"
        onSuccess={() => {
          router.replace(redirectTo);
          router.refresh();
        }}
        onCancel={() => router.replace("/")}
        showCancel
      />
    </motion.div>
  );
}
