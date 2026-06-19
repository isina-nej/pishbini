export function AdminMetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">
        {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
      </p>
    </div>
  );
}
