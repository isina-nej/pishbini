"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "پیش‌بینی", icon: Home },
  { href: "/leaderboard", label: "جدول امتیازات", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#10111f]/95 px-6 py-3 backdrop-blur-lg">
      <div className="flex justify-around">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 text-xs transition-colors",
              pathname === href ? "text-primary" : "text-white/50"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
