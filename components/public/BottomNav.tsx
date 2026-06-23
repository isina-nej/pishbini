"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Home, GitBranch, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { hrefToPageId } from "@/lib/page-access.shared";
import { usePageAccess } from "./PageAccessProvider";

const links: {
  href: string;
  label: string;
  icon: typeof Home;
  skipPageAccess?: boolean;
}[] = [
  { href: "/", label: "پیش‌بینی", icon: Home },
  { href: "/bracket", label: "حذفی", icon: GitBranch },
  { href: "/leaderboard", label: "رتبه‌ها", icon: Trophy },
  { href: "/prizes", label: "جوایز", icon: Gift },
  { href: "/profile", label: "حساب", icon: User, skipPageAccess: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { settings, loaded, showNotice, isPageEnabled } = usePageAccess();

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    skipPageAccess?: boolean
  ) => {
    if (skipPageAccess) {
      if (pathname === href) e.preventDefault();
      return;
    }

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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#10111f]/95 px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg">
      <div className="flex justify-around">
        {links.map(({ href, label, icon: Icon, skipPageAccess }) => {
          const pageId = skipPageAccess ? null : hrefToPageId(href);
          const disabled = loaded && pageId ? !isPageEnabled(pageId) : false;
          const active = pathname === href || (href === "/profile" && pathname === "/login");

          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => handleClick(e, href, skipPageAccess)}
              aria-disabled={disabled}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-1 text-[9px] transition-colors sm:text-[10px]",
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
