"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Props = {
  count: number;
  onSubmit: () => void;
};

export function SubmitPredictionsBar({ count, onSubmit }: Props) {
  const router = useRouter();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[48] mx-auto max-w-[430px] px-4"
      style={{
        bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <motion.button
        type="button"
        data-tour="submit-predictions"
        onClick={() => router.push("/login?from=/")}
        whileTap={{ scale: 0.97 }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="pointer-events-auto w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-bold text-[#10111f] shadow-lg shadow-primary/20"
      >
        ثبت‌نام برای ایونت‌های بعدی
      </motion.button>
    </div>
  );
}

export function SubmitPredictionsBarSpacer({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="shrink-0"
      style={{ height: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      aria-hidden
    />
  );
}
