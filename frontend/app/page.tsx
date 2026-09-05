"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, logout } from "@/lib/auth";
import {
  Code2,
  Brain,
  Target,
  BarChart3,
  Zap,
  ArrowRight,
  User,
  LogOut,
  BookOpen,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Target,
    title: "Define Target & Topic",
    desc: "Choose from 20+ DSA topics or difficulty tiers to simulate specific target interview scenarios.",
  },
  {
    step: "02",
    icon: Brain,
    title: "Socratic AI Prompting",
    desc: "Experience real-time follow-ups, conceptual questioning, and progressive guidance without direct answers.",
  },
  {
    step: "03",
    icon: Code2,
    title: "Live Code & Explanation",
    desc: "Write solution code in a Monaco editor while communicating your thought process live.",
  },
  {
    step: "04",
    icon: BarChart3,
    title: "Granular Rubric Feedback",
    desc: "Get an engineering evaluation covering runtime complexity, edge cases, quality, and communication.",
  },
];

const FEATURES = [
  { icon: Terminal, label: "Monaco Code Editor" },
  { icon: Zap, label: "Real-time Voice & Text" },
  { icon: ShieldCheck, label: "FAANG-Aligned Rubrics" },
  { icon: BookOpen, label: "20+ Core DSA Categories" },
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
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-blue-500/20 selection:text-blue-200">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-100">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                Algo Mentor
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                AI Platform
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <a href="#how-it-works" className="hover:text-zinc-100 transition-colors">
              How it Works
            </a>
            <a href="#features" className="hover:text-zinc-100 transition-colors">
              Capabilities
            </a>
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all text-xs font-medium text-zinc-200"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#25262a] bg-[#08090a] overflow-hidden">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#191a1d15_1px,transparent_1px),linear-gradient(to_bottom,#191a1d15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Product Positioning & Action */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Engine status indicator */}
                <div className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-md bg-[#111214] border border-[#25262a] text-zinc-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-zinc-300 font-medium">DSA INTERVIEW ENGINE</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-500">v2.4 ACTIVE</span>
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-100 leading-[1.12]">
                  Technical interviews, <br />
                  <span className="text-zinc-400 font-normal">practiced for real.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed font-normal">
                  Master data structures and algorithms through realistic, conversational technical interviews. Code live in Monaco while an AI interviewer tests your solution bounds.
                </p>

                {/* Action CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleStartInterview}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md text-sm transition-all shadow-sm active:scale-[0.98]"
                  >
                    Start Practice Session
                    <ArrowRight className="h-4 w-4 text-zinc-900" />
                  </button>
                  
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Explore Methodology
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Technical System Specs Footer */}
                <div className="pt-4 border-t border-[#191a1d] grid grid-cols-3 gap-3 text-left">
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">ENVIRONMENT</div>
                    <div className="text-xs font-medium text-zinc-300 mt-0.5">Monaco IDE</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">EVALUATION</div>
                    <div className="text-xs font-medium text-zinc-300 mt-0.5">FAANG Rubric</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">TOPICS</div>
                    <div className="text-xs font-medium text-zinc-300 mt-0.5">20+ Categories</div>
                  </div>
                </div>

              </div>

              {/* Right Column: Realistic Workspace Interactive Preview */}
              <div className="lg:col-span-7">
                <div className="relative rounded-lg bg-[#111214] border border-[#25262a] shadow-2xl shadow-black/90 overflow-hidden">
                  
                  {/* Top Window Chrome */}
                  <div className="px-3.5 py-2.5 bg-[#151619] border-b border-[#25262a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
                      </div>
                      <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
                      <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                        <Terminal className="h-3 w-3 text-zinc-400" />
                        session_8f4a2b • LRU Cache
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191a1d] text-amber-400 border border-amber-500/20 font-medium">
                        Medium
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        38:42
                      </span>
                    </div>
                  </div>

                  {/* Workspace Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#25262a] text-xs">
                    
                    {/* Left Pane: Question Statement (5 cols) */}
                    <div className="md:col-span-5 p-4 bg-[#0e0f11] space-y-3 font-sans">
                      <div className="flex items-center justify-between border-b border-[#25262a] pb-2">
                        <span className="text-zinc-200 font-semibold">146. LRU Cache</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Question 1/2</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Design a data structure that follows the constraints of a <strong className="text-zinc-300 font-medium">Least Recently Used (LRU) cache</strong> with <code className="text-blue-400 bg-blue-950/40 px-1 py-0.5 rounded text-[10px]">O(1)</code> time complexity for both get and put operations.
                      </p>
                      <div className="p-2.5 rounded bg-[#151619] border border-[#25262a] space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Constraint Check</span>
                        <div className="text-[11px] text-zinc-300 font-mono">Capacity: 1 ≤ capacity ≤ 3000</div>
                      </div>
                    </div>

                    {/* Right Pane: Code Editor + AI Dialogue (7 cols) */}
                    <div className="md:col-span-7 flex flex-col bg-[#0b0c0e]">
                      
                      {/* Editor Sub-header */}
                      <div className="px-3 py-1.5 bg-[#151619] border-b border-[#25262a] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">solution.py</span>
                        <span className="text-zinc-500">Python 3</span>
                      </div>

                      {/* Mock Code Box */}
                      <div className="p-3 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-hidden bg-[#08090a] border-b border-[#25262a]">
                        <div className="text-zinc-500"><span className="text-purple-400">class</span> <span className="text-yellow-200">LRUCache</span>:</div>
                        <div className="pl-3"><span className="text-purple-400">def</span> <span className="text-blue-400">__init__</span>(self, capacity: <span className="text-amber-300">int</span>):</div>
                        <div className="pl-6 text-zinc-400">self.cap = capacity</div>
                        <div className="pl-6 text-zinc-400">self.cache = &#123;&#125; <span className="text-zinc-600"># key -&gt; Node</span></div>
                        <div className="pl-6 text-zinc-400">self.left, self.right = Node(<span className="text-emerald-400">0</span>, <span className="text-emerald-400">0</span>), Node(<span className="text-emerald-400">0</span>, <span className="text-emerald-400">0</span>)</div>
                        <div className="pl-6 text-zinc-400">self.left.next = self.right</div>
                      </div>

                      {/* Live AI Interviewer Dialogue Box */}
                      <div className="p-3 bg-[#111214] space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                            <Brain className="h-3 w-3" />
                          </div>
                          <span className="font-semibold text-[11px] text-zinc-200">AI Interviewer</span>
                          <span className="text-[10px] font-mono text-zinc-500">Just now</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed pl-7 border-l-2 border-blue-500/40">
                          &quot;Good start setup with sentinel nodes. Before writing <code className="text-zinc-200 font-mono text-[10px] bg-zinc-800 px-1 py-0.5 rounded">get()</code>, walk me through how you will maintain O(1) order updates.&quot;
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Status Footer Bar */}
                  <div className="px-3 py-1.5 bg-[#151619] border-t border-[#25262a] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Candidate Mic Active • Live Socratic Evaluation
                    </span>
                    <span>Press Ctrl+Enter to submit code</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-zinc-800/60 pb-6">
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Workflow
              </span>
              <h2 className="text-2xl font-semibold text-zinc-100 mt-1 tracking-tight">
                Designed for Rigorous Preparation
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm mt-2 sm:mt-0">
              Mirrors actual staff-level interview loops from leading technology organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-[#121215] border border-zinc-800/80 rounded-md p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-zinc-500 font-medium">
                      {item.step}
                    </span>
                    <item.icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <h3 className="font-medium text-sm text-zinc-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA Card */}
          <div className="mt-12 bg-[#121215] border border-zinc-800/80 rounded-md p-8 text-center flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Ready to evaluate your algorithmic problem-solving?
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              No complex setup required. Select your parameters and enter the interview workspace immediately.
            </p>
            <button
              onClick={handleStartInterview}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start Free Mock Interview"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Code2 className="h-3 w-3" />
            </div>
            <span className="font-medium text-zinc-300">Algo Mentor</span>
            <span>— Technical Interview Simulator</span>
          </div>

          <div className="flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="hover:text-zinc-300 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-zinc-300 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="hover:text-zinc-300 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}