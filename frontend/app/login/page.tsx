"use client";

import { LoginForm } from "@/components/LoginForm";
import { Code2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 p-4">
      <div className="w-full max-w-sm bg-[#121215] border border-zinc-800/80 rounded-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mx-auto">
            <Code2 className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
            Sign in to Algo Mentor
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your candidate credentials to continue
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-800/60">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-zinc-200 hover:text-white font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}