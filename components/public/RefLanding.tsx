import Link from "next/link";

type Props = {
  code: string;
};

/** Minimal HTML for social crawlers — real users never see this (middleware redirects them). */
export function RefLanding({ code }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-white">پیش‌بینی جام جهانی</h1>
      <p className="text-sm text-white/75">
        با لینک دعوت <span className="font-mono text-primary">{code.toUpperCase()}</span> در کمپین
        پیشرو سرمایه شرکت کن.
      </p>
      <Link href="/" className="text-sm text-primary underline">
        ورود به سایت
      </Link>
    </main>
  );
}
