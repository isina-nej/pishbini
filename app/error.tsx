"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-bold">خطایی رخ داد</h1>
      <p className="text-sm text-white/65">لطفاً دوباره تلاش کنید.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-[#10111f]"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
