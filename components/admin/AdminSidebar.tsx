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
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/teams", label: "تیم‌ها", icon: Shield },
  { href: "/admin/matches", label: "بازی‌ها", icon: Calendar },
  { href: "/admin/bracket", label: "جدول حذفی", icon: GitBranch },
  { href: "/admin/users", label: "شرکت‌کنندگان", icon: Users },
  { href: "/admin/point-rules", label: "قوانین امتیاز", icon: Star },
  { href: "/admin/leaderboard", label: "جدول امتیازات", icon: Trophy },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 shrink-0 border-l border-white/10 bg-black/30 p-4">
      <h2 className="mb-6 text-lg font-bold text-primary">پنل مدیریت</h2>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === href ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
      >
        <LogOut className="h-4 w-4" />
        خروج
      </button>
    </aside>
  );
}
