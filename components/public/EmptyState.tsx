"use client";

import { motion } from "framer-motion";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mx-4 p-8 text-center"
    >
      <p className="mb-2 text-lg font-semibold">{title}</p>
      <p className="text-sm text-white/65">{description}</p>
    </motion.div>
  );
}
