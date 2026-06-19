"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("رمز عبور اشتباه است");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-sm p-8">
        <h1 className="mb-6 text-center text-xl font-bold">ورود مدیر</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary"
          placeholder="رمز عبور"
        />
        {error && <p className="mb-4 text-center text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-bold text-[#10111f] disabled:opacity-50"
        >
          {loading ? "..." : "ورود"}
        </button>
      </form>
    </div>
  );
}
