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
  ChevronRight,
  SlidersHorizontal,
  ArrowRight,
  Layers,
} from "lucide-react";
import { logout } from "@/lib/auth";
import FeedbackForm from "@/components/FeedbackForm";

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
  { label: "All Tiers", value: null },
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
      const response = await getRecentInterviews(1, 6);
      setRecentInterviews(response.interviews.slice(0, 6));
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
      setError("Failed to start interview. Please try again or refine your filter selection.");
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
      setError(err instanceof Error ? err.message : "Failed to start interview.");
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
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-blue-500/20 selection:text-blue-200">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-100">
                <Code2 className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-zinc-100">Algo Mentor</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  Workspace
                </span>
              </div>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <a href="#configure" className="hover:text-zinc-100 transition-colors">Configure Session</a>
            <a href="#history" className="hover:text-zinc-100 transition-colors">History</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all text-xs font-medium text-zinc-200"
            >
              <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-200">
                {profile?.username?.charAt(0)?.toUpperCase() ?? <User className="h-3 w-3" />}
              </div>
              <span className="hidden sm:inline text-zinc-300">{profile?.username ?? "Account"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all"
              aria-label="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-10">
        {/* Top Header / Metrics Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-8">
          <div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {profile?.username ? `Candidate: ${profile.username}` : "Interview Control Center"}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
              Technical Assessment Setup
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#121215] border border-zinc-800/80 rounded-md px-4 py-2 text-left min-w-[120px]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Total Completed</div>
              <div className="text-lg font-semibold text-zinc-100">{totalInterviews}</div>
            </div>
            <div className="bg-[#121215] border border-zinc-800/80 rounded-md px-4 py-2 text-left min-w-[120px]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Topics Pool</div>
              <div className="text-lg font-semibold text-zinc-100">{DSA_TOPICS.length}</div>
            </div>
          </div>
        </div>

        {/* Configure Session Form */}
        <section id="configure" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121215] border border-zinc-800/80 rounded-md p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                    Parameters & Filters
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {selectedTopics.size > 0 ? `${selectedTopics.size} Topic(s) Selected` : "Random Topics"}
                </span>
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-400">
                  Target Difficulty Tier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIFFICULTIES.map((d) => {
                    const isSelected = selectedDifficulty === d.value;
                    return (
                      <button
                        key={d.label}
                        onClick={() => setSelectedDifficulty(d.value)}
                        className={`px-3 py-2 rounded-md text-xs font-medium border transition-all text-center ${
                          isSelected
                            ? "bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm"
                            : "bg-[#18181b] text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Pills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-400">
                    Data Structure & Algorithm Topics
                  </label>
                  {selectedTopics.size > 0 && (
                    <button
                      onClick={() => setSelectedTopics(new Set())}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedTopics(new Set())}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      selectedTopics.size === 0
                        ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                        : "bg-[#18181b] text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    Any Topic
                  </button>
                  {DSA_TOPICS.map((topic) => {
                    const isSelected = selectedTopics.has(topic);
                    return (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize ${
                          isSelected
                            ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                            : "bg-[#18181b] text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-md px-3.5 py-2.5">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-800/60">
                <button
                  onClick={handleQuickStart}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md text-xs transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <span>Initializing Session…</span>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Instant Start Session
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium rounded-md text-xs transition-all disabled:opacity-50"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Customize Candidate Profile
                </button>
              </div>
            </div>
          </div>

          {/* Quick Context Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#121215] border border-zinc-800/80 rounded-md p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-400" />
                Assessment Environment
              </h3>
              <ul className="text-xs text-zinc-400 space-y-2.5 list-disc list-inside leading-relaxed">
                <li>Real-time Monaco code editor supporting multiple languages.</li>
                <li>Socratic AI interviewer providing live feedback & edge-case prompts.</li>
                <li>Integrated timer & comprehensive evaluation scorecards upon completion.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Recent Interviews / History Section */}
        <section id="history" className="space-y-4 scroll-mt-14 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                Recent Interview Logs
              </h2>
              <p className="text-xs text-zinc-400">Review past transcripts, performance scores, or resume open sessions.</p>
            </div>
            <button
              onClick={handleGoToProfile}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              All Records <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-[#121215] border border-zinc-800/60 rounded-md animate-pulse" />
              ))}
            </div>
          ) : recentInterviews.length === 0 ? (
            <div className="text-center py-12 bg-[#121215] border border-zinc-800/80 rounded-md">
              <Clock className="mx-auto h-8 w-8 mb-2 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">No session history recorded</p>
              <p className="text-xs text-zinc-500 mt-1">Start your first technical interview session above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentInterviews.map((interview) => {
                const isEnded = interview.phase === "ended";
                return (
                  <div
                    key={interview.interview_id}
                    onClick={() => handleResumeInterview(interview.session_id)}
                    className="group bg-[#121215] hover:bg-[#18181b] border border-zinc-800/80 hover:border-zinc-700 rounded-md p-4 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-300">
                          {isEnded ? <Trophy className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        </div>
                        <span className="font-semibold text-xs text-zinc-200">
                          Session #{interview.interview_id}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isEnded
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                            : "bg-blue-950/40 text-blue-400 border-blue-900/60"
                        }`}
                      >
                        {isEnded ? "Completed" : "Active"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/40">
                      <span>{isEnded ? "Evaluation Ready" : "In Progress"}</span>
                      <span className="group-hover:text-zinc-100 flex items-center gap-1 font-medium text-xs transition-colors">
                        {isEnded ? "View Report" : "Resume Workspace"}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Feedback Component */}
        <section id="feedback" className="pt-8 border-t border-zinc-800/80 space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-semibold text-zinc-100">
              Product Feedback
            </h2>
            <p className="text-xs text-zinc-400">
              Help us refine the interviewer prompt engine and rubric scoring algorithms.
            </p>
          </div>
          <div className="max-w-xl">
            <FeedbackForm />
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300">Algo Mentor</span>
            <span>— Candidate Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleGoToProfile} className="hover:text-zinc-300 transition-colors">Profile</button>
            <button onClick={handleLogout} className="hover:text-zinc-300 transition-colors">Logout</button>
          </div>
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

