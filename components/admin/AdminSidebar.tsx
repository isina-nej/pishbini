"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  Shield,
  Star,
  LogOut,
  GitBranch,
  ExternalLink,
  X,
  PanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/teams", label: "تیم‌ها", icon: Shield },
  { href: "/admin/matches", label: "بازی‌ها", icon: Calendar },
  { href: "/admin/bracket", label: "جدول حذفی", icon: GitBranch },
  { href: "/admin/users", label: "شرکت‌کنندگان", icon: Users },
  { href: "/admin/point-rules", label: "قوانین امتیاز", icon: Star },
  { href: "/admin/pages", label: "دسترسی صفحات", icon: PanelTop },
  { href: "/admin/leaderboard", label: "جدول امتیازات", icon: Trophy },
];

export function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-50 flex w-[var(--admin-sidebar-w)] flex-col border-e border-[var(--admin-border)] bg-[var(--admin-sidebar)] transition-transform duration-200 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5">
        <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--admin-primary-soft)]">
            <Trophy className="size-4 text-[var(--admin-primary)]" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">پیشرو سرمایه</p>
            <p className="text-[10px] text-[var(--admin-text-subtle)]">پنل مدیریت کمپین</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-hover)] lg:hidden"
          aria-label="بستن"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-subtle)]">
          مدیریت
        </p>
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "admin-sidebar-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "active text-[var(--admin-primary)]"
                  : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text)]"
              )}
            >
              <Icon className={cn("admin-nav-icon size-[18px]", active && "text-[var(--admin-primary)]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-[var(--admin-border)] p-3">
        <Link
          href="/"
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text)]"
        >
          <ExternalLink className="size-[18px]" />
          مشاهده سایت
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--admin-danger)] transition-colors hover:bg-[var(--admin-danger-soft)]"
        >
          <LogOut className="size-[18px]" />
          خروج از پنل
        </button>
      </div>
    </aside>
  );
}
