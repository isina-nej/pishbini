import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "primary";

const tones: Record<Tone, string> = {
  default: "bg-[var(--admin-surface-elevated)] text-[var(--admin-text-muted)]",
  success: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  warning: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  danger: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  info: "bg-[var(--admin-secondary-soft)] text-[var(--admin-secondary)]",
  primary: "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]",
};

const statusMap: Record<string, Tone> = {
  SCHEDULED: "info",
  ACTIVE: "primary",
  LOCKED: "warning",
  FINISHED: "success",
  CANCELLED: "danger",
  SENT: "success",
  FAILED: "danger",
};

export function AdminBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const tone = statusMap[status] ?? "default";
  return <AdminBadge tone={tone}>{status}</AdminBadge>;
}
