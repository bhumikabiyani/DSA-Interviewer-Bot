"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await login({ username, password });
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-xs font-medium text-zinc-400">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="enter username"
          className="w-full px-3 py-2 text-xs rounded-md bg-[#18181b] border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-medium text-zinc-400">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full px-3 py-2 text-xs rounded-md bg-[#18181b] border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 rounded-md text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <div className="flex items-center my-5 gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          or
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <GoogleAuthButton text="Sign in with Google" />
    </form>
  );
}

