"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import { nameSchema, phoneInputSchema } from "@/lib/validation";

const formSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneInputSchema,
});

export type SubmitFormData = z.infer<typeof formSchema>;

type Props = {
  onSubmit: (data: SubmitFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
};

export function SubmitForm({ onSubmit, loading, error }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitFormData>({
    resolver: zodResolver(formSchema),
  });

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="mx-4 space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm text-white/65">نام</label>
        <input
          {...register("firstName")}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          placeholder="نام"
        />
        {errors.firstName && (
          <p className="mt-1 text-xs text-danger">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/65">نام خانوادگی</label>
        <input
          {...register("lastName")}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          placeholder="نام خانوادگی"
        />
        {errors.lastName && (
          <p className="mt-1 text-xs text-danger">{errors.lastName.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/65">شماره موبایل</label>
        <input
          {...register("phone")}
          type="tel"
          dir="ltr"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white outline-none focus:border-primary"
          placeholder="09123456789"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>
        )}
      </div>

      {error && <p className="text-center text-sm text-danger">{error}</p>}

      <motion.button
        type="submit"
        disabled={loading}
        whileTap={{ scale: 0.97 }}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-bold text-[#10111f] disabled:opacity-50"
      >
        {loading ? "در حال ثبت..." : "تایید نهایی"}
      </motion.button>
    </motion.form>
  );
}
