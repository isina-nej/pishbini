import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { LoginForm } from "@/components/public/LoginForm";
import { resolveUserIdFromCookies } from "@/lib/me-user";

type Props = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const userId = await resolveUserIdFromCookies();
  if (userId) {
    const { from } = await searchParams;
    redirect(from || "/profile");
  }

  return (
    <PublicPageShell pageId="profile" showNav>
      <div className="pb-32 pt-6">
        <header className="mb-4 flex items-center justify-between px-4">
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/5"
          >
            انصراف
          </Link>
          <div className="flex-1 text-center" data-tour="login-header">
            <h1 className="text-xl font-bold">ورود به حساب</h1>
          </div>
          <div className="w-[52px]" aria-hidden />
        </header>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </PublicPageShell>
  );
}
