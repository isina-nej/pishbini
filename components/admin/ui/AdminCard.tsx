import { cn } from "@/lib/utils";

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-card", className)}>{children}</div>;
}

export function AdminCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-card-header flex items-start justify-between gap-4">
      <div>
        <h3 className="font-semibold text-[var(--admin-text)]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function AdminCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-card-body", className)}>{children}</div>;
}
