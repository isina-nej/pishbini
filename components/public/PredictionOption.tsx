import { PredictionChoice } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type Props = {
  choice: PredictionChoice;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export function PredictionOption({ label, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border border-white/10 py-2.5 text-xs font-medium transition-all",
        selected
          ? "glow-selected pulse-soft border-primary bg-gradient-to-b from-primary/20 to-secondary/20"
          : "bg-white/5 text-white/70 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}
