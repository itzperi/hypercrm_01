"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white font-display font-bold text-lg mb-4">
            H
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Hyperwrike OS</h1>
          <p className="text-muted mt-1 text-sm">Internal CRM & Business Management</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-lg bg-brand-600 text-white font-medium",
              "hover:bg-brand-700 transition-colors disabled:opacity-50"
            )}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
