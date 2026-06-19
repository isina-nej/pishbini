"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LoadingState({ message = "در حال بارگذاری..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-sm text-white/65">{message}</p>
    </div>
  );
}
