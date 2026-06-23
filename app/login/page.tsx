import { Suspense } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { LoginForm } from "@/components/public/LoginForm";

export default function LoginPage() {
  return (
    <PublicPageShell pageId="profile" showNav={false}>
      <div className="pb-8 pt-8">
        <header className="mb-6 px-4 text-center" data-tour="login-header">
          <h1 className="text-2xl font-bold">ورود به حساب</h1>
          <p className="mt-2 text-sm text-white/55">
            با شماره موبایل و کد تأیید وارد شوید
          </p>
        </header>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </PublicPageShell>
  );
}
