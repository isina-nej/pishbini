"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Home, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { hrefToPageId } from "@/lib/page-access";
import { usePageAccess } from "./PageAccessProvider";

const links = [
  { href: "/", label: "پیش‌بینی", icon: Home },
  { href: "/bracket", label: "جدول حذفی", icon: GitBranch },
  { href: "/leaderboard", label: "جدول امتیازات", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const { settings, loaded, showNotice, isPageEnabled } = usePageAccess();

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const pageId = hrefToPageId(href);
    if (!pageId || !loaded) return;

    if (!isPageEnabled(pageId)) {
      e.preventDefault();
      showNotice(settings[pageId].message);
      return;
    }

    if (pathname === href) {
      e.preventDefault();
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#10111f]/95 px-6 py-3 backdrop-blur-lg">
      <div className="flex justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const pageId = hrefToPageId(href);
          const disabled = loaded && pageId ? !isPageEnabled(pageId) : false;
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => handleClick(e, href)}
              aria-disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                active && !disabled && "text-primary",
                !active && !disabled && "text-white/50 hover:text-white/70",
                disabled && "cursor-not-allowed text-white/25"
              )}
            >
              <Icon className={cn("h-5 w-5", disabled && "opacity-60")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
