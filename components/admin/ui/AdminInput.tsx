import { cn } from "@/lib/utils";

export function AdminInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("admin-input", className)} {...props} />;
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("admin-input", className)} {...props}>
      {children}
    </select>
  );
}

export function AdminLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]", className)}>
      {children}
    </label>
  );
}
