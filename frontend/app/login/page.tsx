"use client";

import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div
      className="
        relative min-h-screen overflow-hidden
        flex items-center justify-center
        bg-gradient-to-br from-blue-50 to-indigo-100
        dark:from-gray-900 dark:to-gray-800
      "
    >
      {/* 🌑 Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 85%)",
        }}
      />

      {/* 🔲 Rotated Square Mesh */}
      <div
        aria-hidden
        className="absolute inset-[-50%] pointer-events-none"
        style={{
          transform: "rotate(30deg) translateX(-10%)",
          animation: "meshMove 60s linear infinite",
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 🌫️ Top light fade */}
      <div
        aria-hidden
        className="
          absolute inset-0 pointer-events-none
          bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]
          dark:bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.4),transparent_60%)]
        "
      />

      {/* 🔐 Glass Login Card */}
      <div
        className="
          relative z-10
          w-full max-w-md
          rounded-2xl
          bg-[#1f2937]/70
          backdrop-blur-xl
          border border-white/20
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          p-8
        "
      >
        {/* ✨ Glass highlight */}
        <div
          aria-hidden
          className="
            absolute inset-0 rounded-2xl
            bg-gradient-to-br from-white/10 via-white/5 to-transparent
          "
        />

        {/* Content */}
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-center text-white mb-6">
            Login
          </h2>

          <LoginForm />

          <p className="mt-4 text-center text-sm text-gray-300">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="
                font-medium text-indigo-400
                hover:text-indigo-300
              "
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}