import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const accents = {
  primary: "bg-[var(--admin-primary)]",
  secondary: "bg-[var(--admin-secondary)]",
  success: "bg-[var(--admin-success)]",
  warning: "bg-[var(--admin-warning)]",
  danger: "bg-[var(--admin-danger)]",
} as const;

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: keyof typeof accents;
  hint?: string;
}) {
  return (
    <div className="admin-card relative overflow-hidden p-4 transition-colors hover:border-[var(--admin-border-strong)]">
      <span className={cn("admin-metric-accent", accents[accent])} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 ps-2">
          <p className="text-xs font-medium text-[var(--admin-text-muted)]">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold tabular-nums tracking-tight text-[var(--admin-text)]">
            {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-[11px] text-[var(--admin-text-subtle)]">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-elevated)]">
            <Icon className="size-[18px] text-[var(--admin-text-muted)]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--admin-text-subtle)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
