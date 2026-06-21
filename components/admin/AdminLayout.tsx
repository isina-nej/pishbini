"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Menu } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="admin-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="admin-main">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)]"
            aria-label="باز کردن منو"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">پنل مدیریت پیشرو</span>
        </header>

        <div className="admin-content admin-animate-in">{children}</div>
      </div>
    </div>
  );
}
