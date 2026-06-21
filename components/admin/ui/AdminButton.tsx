import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--admin-primary)] text-[var(--admin-primary-fg)] hover:brightness-110 shadow-[0_0_20px_rgba(20,224,189,0.15)]",
  secondary:
    "bg-[var(--admin-secondary-soft)] text-[var(--admin-secondary)] hover:bg-[rgba(67,101,255,0.2)]",
  outline:
    "border border-[var(--admin-border-strong)] bg-transparent text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)]",
  ghost:
    "bg-transparent text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text)]",
  danger:
    "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)] hover:bg-[rgba(255,77,109,0.2)]",
};

export function AdminButton({
  children,
  variant = "primary",
  className,
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
