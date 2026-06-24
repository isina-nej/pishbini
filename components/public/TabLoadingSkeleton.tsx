import { LoadingState } from "@/components/public/LoadingState";

export function TabLoadingSkeleton() {
  return (
    <div className="min-h-dvh pb-32 pt-6">
      <LoadingState />
    </div>
  );
}
