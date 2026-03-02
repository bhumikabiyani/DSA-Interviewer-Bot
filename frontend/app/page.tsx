"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { logout } from "@/lib/auth";
import {
  Code2,
  Brain,
  Target,
  BarChart3,
  Zap,
  Sparkles,
  ChevronRight,
  User,
  LogOut,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

const HOW_IT_WORKS = [
  {
    icon: Target,
    title: "Pick Your Focus",
    desc: "Select a DSA topic and difficulty level to tailor the interview to your skill level.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI Interviews You",
    desc: "Our AI interviewer asks FAANG-style questions and follows up just like a real interviewer.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Code2,
    title: "Code Your Solution",
    desc: "Write and explain your solution live. The AI adapts to your approach and gives hints.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BarChart3,
    title: "Get Evaluated",
    desc: "Receive detailed feedback on correctness, complexity, code quality, and communication.",
    color: "from-emerald-500 to-teal-500",
  },
];

const FEATURES = [
  { icon: Zap, label: "Real-time AI feedback" },
  { icon: BookOpen, label: "20+ DSA topics" },
  { icon: Target, label: "3 difficulty levels" },
  { icon: Brain, label: "FAANG-style questions" },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  const handleStartInterview = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login?redirect=/dashboard");
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white leading-none">Algo Mentor</span>
              <span className="hidden sm:block text-[10px] text-indigo-400 leading-none tracking-wider uppercase">DSA Interview AI</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a href="#how-it-works" className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">How It Works</a>
            <a href="#features" className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">Features</a>
          </nav>

          {/* Auth controls */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-sm font-medium text-gray-200"
                >
                  <User className="h-4 w-4 text-indigo-400" />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden pt-24 pb-20">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Mock Interviews
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Ace Your{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DSA Interview
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Practice real FAANG-style data structures &amp; algorithms interviews with an AI that adapts to your level, gives live hints, and provides detailed evaluations.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleStartInterview}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-200 text-lg hover:scale-[1.03]"
              >
                <Zap className="h-5 w-5" />
                Start Interview
              </button>
              <a
                href="#how-it-works"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-white font-semibold rounded-2xl transition-all duration-200 text-lg"
              >
                How It Works
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>

            {/* Feature badges */}
            <div id="features" className="flex flex-wrap justify-center gap-3 pt-4">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300">
                  <Icon className="h-4 w-4 text-indigo-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 pb-24 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
            <p className="text-gray-400 mt-3 text-lg">Four steps to sharpen your interview skills</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <div className="absolute top-5 right-5 text-5xl font-black text-white/5 select-none">{i + 1}</div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 text-center">
            <button
              onClick={handleStartInterview}
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 text-lg hover:scale-[1.02]"
            >
              <Zap className="h-5 w-5" />
              {isLoggedIn ? "Go to Dashboard" : "Get Started — It's Free"}
            </button>
            {!isLoggedIn && (
              <p className="mt-3 text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Log in</Link>
              </p>
            )}
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Code2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-gray-400">Algo Mentor</span>
            <span className="text-gray-600">— AI DSA Interview Practice</span>
          </div>
          <div className="flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <button onClick={() => router.push("/dashboard")} className="hover:text-gray-300 transition-colors">Dashboard</button>
                <button onClick={handleLogout} className="hover:text-red-400 transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-300 transition-colors">Login</Link>
                <Link href="/register" className="hover:text-gray-300 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>
        <div className="text-center text-xs text-gray-700 pb-4">
          © {new Date().getFullYear()} AlgoMentor. Built for interview preparation.
        </div>
      </footer>
    </div>
  );
}