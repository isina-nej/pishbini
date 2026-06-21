import { AdminCard, AdminCardBody } from "./AdminCard";

export function AdminLoading({ label = "در حال بارگذاری..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--admin-border-strong)] border-t-[var(--admin-primary)]" />
      <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <AdminCard>
      <AdminCardBody className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-[var(--admin-surface-elevated)]"
          />
        ))}
      </AdminCardBody>
    </AdminCard>
  );
}
