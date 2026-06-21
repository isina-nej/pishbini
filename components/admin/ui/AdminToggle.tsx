"use client";

export function AdminToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-4 py-3 transition-colors hover:border-[var(--admin-border-strong)]">
      <div>
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-[var(--admin-text-muted)]">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--admin-primary)]" : "bg-[var(--admin-text-subtle)]"
        }`}
      >
        <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "end-0.5" : "start-0.5"
        }`}
        />
      </button>
    </label>
  );
}
