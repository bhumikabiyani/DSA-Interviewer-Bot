"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { getRecentInterviews, startInterview, getLastInterviewInfo, getUserProfile } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { Interview, CandidateInfo, UserProfile } from "@/lib/types";
import { PreInterviewForm } from "@/components/PreInterviewForm";
import {
  Clock,
  User,
  LogOut,
  BookOpen,
  Zap,
  Trophy,
  Code2,
  Brain,
  Target,
  ChevronRight,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { logout } from "@/lib/auth";

const DSA_TOPICS = [
  "arrays",
  "binary search",
  "binary search tree",
  "binary tree",
  "bit manipulation",
  "data-structure",
  "dynamic programming",
  "graph",
  "greedy",
  "hashing",
  "heap",
  "linked list",
  "maths",
  "queue",
  "recursion",
  "sorting",
  "stack",
  "string",
  "trie",
  "two pointer",
];

const DIFFICULTIES = [
  { label: "All", value: null },
  { label: "Easy", value: 0 },
  { label: "Medium", value: 1 },
  { label: "Hard", value: 2 },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentInterviews, setRecentInterviews] = useState<Interview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lastCandidateInfo, setLastCandidateInfo] = useState<{
    type?: string;
    current_role?: string;
    organization?: string;
    expectations?: string;
    difficulty?: string;
  } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const { reset } = useChatStore();

  useEffect(() => {
    fetchRecentInterviews();
    fetchLastCandidateInfo();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchRecentInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const response = await getRecentInterviews(1, 3);
      setRecentInterviews(response.interviews.slice(0, 3));
      setTotalInterviews(response.total_count ?? response.interviews.length);
    } catch (err) {
      console.error("Failed to fetch recent interviews:", err);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const fetchLastCandidateInfo = async () => {
    try {
      const response = await getLastInterviewInfo();
      setLastCandidateInfo(response.candidate_info);
    } catch (err) {
      console.error("Failed to fetch last candidate info:", err);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const handleQuickStart = async () => {
    setLoading(true);
    setError(null);
    reset();
    try {
      const topicStr = selectedTopics.size > 0 ? Array.from(selectedTopics).join(",") : null;
      const response = await startInterview(topicStr, selectedDifficulty);
      router.push(`/interview/${response.session_id}`);
    } catch (err) {
      setError("Failed to start interview, no questions found for this selection.");
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: CandidateInfo) => {
    setLoading(true);
    setError(null);
    reset();
    try {
      const topicStr = selectedTopics.size > 0 ? Array.from(selectedTopics).join(",") : null;
      const response = await startInterview(topicStr, selectedDifficulty, data);
      router.push(`/interview/${response.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interview");
      setLoading(false);
    }
  };

  const handleResumeInterview = (sessionId: string) => {
    reset();
    router.push(`/interview/${sessionId}`);
  };

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo + brand */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white leading-none">Algo Mentor</span>
                <span className="hidden sm:block text-[10px] text-indigo-400 leading-none tracking-wider uppercase">DSA Interview AI</span>
              </div>
            </button>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a href="#start" className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">Practice</a>
            <a href="#recent" className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">History</a>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-sm font-medium text-gray-200"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {profile?.username?.charAt(0)?.toUpperCase() ?? <User className="h-3 w-3" />}
              </div>
              <span className="hidden sm:block">{profile?.username ?? "Profile"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-12">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              {profile?.username ? `Welcome back, ${profile.username}! 👋` : "AI-Powered Mock Interviews"}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
              Ace Your{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DSA Interview
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Pick a topic and difficulty, then jump into a live mock interview.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              {[
                { icon: Trophy, label: "Your Interviews", value: totalInterviews },
                { icon: BookOpen, label: "DSA Topics", value: DSA_TOPICS.length },
                { icon: Zap, label: "AI-Powered", value: "Real-time" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                  <Icon className="h-5 w-5 text-indigo-400" />
                  <div className="text-left">
                    <div className="font-bold text-white text-lg leading-none">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start Card */}
        <section id="start" className="max-w-2xl mx-auto px-4 pb-16 scroll-mt-20">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Quick Start
              </h2>
              <p className="text-sm text-gray-400">Choose your focus or leave both blank for a random challenge.</p>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Difficulty
              </label>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map((d) => {
                  const isSelected = selectedDifficulty === d.value;
                  const colorMap: Record<string, string> = {
                    All: "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/30",
                    Easy: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/30",
                    Medium: "bg-amber-500 text-white border-amber-500 shadow-amber-500/30",
                    Hard: "bg-red-600 text-white border-red-600 shadow-red-500/30",
                  };
                  const idleMap: Record<string, string> = {
                    All: "bg-white/5 text-gray-300 border-white/10 hover:border-indigo-500/60",
                    Easy: "bg-white/5 text-gray-300 border-white/10 hover:border-emerald-500/60",
                    Medium: "bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/60",
                    Hard: "bg-white/5 text-gray-300 border-white/10 hover:border-red-500/60",
                  };
                  return (
                    <button
                      key={d.label}
                      onClick={() => setSelectedDifficulty(d.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 shadow-sm ${isSelected ? colorMap[d.label] + " shadow-lg" : idleMap[d.label]}`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Topic
                </label>
                {selectedTopics.size > 0 && (
                  <button
                    onClick={() => setSelectedTopics(new Set())}
                    className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors"
                  >
                    Clear ({selectedTopics.size} selected)
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTopics(new Set())}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${selectedTopics.size === 0
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white/5 text-gray-400 border-white/10 hover:border-indigo-500/60 hover:text-gray-200"
                    }`}
                >
                  All
                </button>
                {DSA_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.has(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 capitalize ${isSelected
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500"
                        : "bg-white/5 text-gray-400 border-white/10 hover:border-indigo-500/60 hover:text-gray-200"
                        }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleQuickStart}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 disabled:opacity-50 text-base"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Starting…
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Quick Start
                  </>
                )}
              </button>
              <button
                onClick={() => setShowForm(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 text-base"
              >
                <User className="h-5 w-5 text-indigo-400" />
                Personalized Start
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Recent Interviews */}
        <section id="recent" className="max-w-6xl mx-auto px-4 pb-24 scroll-mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Recent Interviews</h2>
            <button
              onClick={handleGoToProfile}
              className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loadingInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse border border-white/10" />
              ))}
            </div>
          ) : recentInterviews.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <Clock className="mx-auto h-12 w-12 mb-4 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">No interviews yet</p>
              <p className="text-sm text-gray-500 mt-1">Complete your first interview to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentInterviews.map((interview) => {
                const isEnded = interview.phase === "ended";
                return (
                  <button
                    key={interview.interview_id}
                    onClick={() => handleResumeInterview(interview.session_id)}
                    className="group p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all duration-200 text-left transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${isEnded ? "bg-emerald-500/20" : "bg-indigo-500/20"}`}>
                        {isEnded ? (
                          <Trophy className={`h-5 w-5 text-emerald-400`} />
                        ) : (
                          <Clock className="h-5 w-5 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">
                          Interview #{interview.interview_id}
                        </h3>
                        <span className={`text-xs font-medium ${isEnded ? "text-emerald-400" : "text-indigo-400"}`}>
                          {isEnded ? "Completed" : "In Progress"}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${isEnded ? "text-emerald-500" : "text-indigo-500"}`}>
                      {isEnded ? "View results" : "Resume"} <ChevronRight className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
            <button
              onClick={handleGoToProfile}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="text-center text-xs text-gray-700 pb-4">
          © {new Date().getFullYear()} AlgoMentor. Built for interview preparation.
        </div>
      </footer>

      <PreInterviewForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        loading={loading}
        initialData={lastCandidateInfo}
      />
    </div>
  );
}
