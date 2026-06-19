"use client";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="glass-card mx-4 border-danger/50 p-6 text-center">
      <p className="text-danger">{message}</p>
    </div>
  );
}
