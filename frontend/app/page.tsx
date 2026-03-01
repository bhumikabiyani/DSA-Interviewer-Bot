"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getRecentInterviews, startInterview, getLastInterviewInfo, startInterviewWithForm } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { Interview, CandidateInfo } from "@/lib/types";
import { PreInterviewForm } from "@/components/PreInterviewForm";
import { Clock, User } from "lucide-react";

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
  "linked-list",
  "maths",
  "queue",
  "recursion",
  "sorting",
  "stack",
  "string",
  "trie",
  "two pointer",
  "two-pointers"
]

const DIFFICULTIES = [
  { label: "All", value: null },
  { label: "Easy", value: 0 },
  { label: "Medium", value: 1 },
  { label: "Hard", value: 2 },
] as const;

export default function Home() {
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
  const { reset } = useChatStore();

  useEffect(() => {
    fetchRecentInterviews();
    fetchLastCandidateInfo();
  }, []);

  const fetchRecentInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const response = await getRecentInterviews(1, 3);
      setRecentInterviews(response.interviews.slice(0, 3));
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
      setError(err instanceof Error ? err.message : "Failed to start interview");
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: CandidateInfo) => {
    setLoading(true);
    setError(null);
    reset();
    try {
      const response = await startInterviewWithForm(data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleGoToProfile}
          className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-200 text-white"
          aria-label="Go to profile"
        >
          <User className="h-6 w-6" />
        </button>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-3 max-w-2xl animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
              AI Mock DSA Interviewer
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Practice FAANG-style DSA interviews with AI
            </p>
          </div>

          {/* Quick Start Card */}
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">

            {/* Difficulty Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Difficulty
              </label>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map((d) => {
                  const isSelected = selectedDifficulty === d.value;
                  const colorMap: Record<string, string> = {
                    All: "bg-indigo-600 text-white border-indigo-600",
                    Easy: "bg-emerald-500 text-white border-emerald-500",
                    Medium: "bg-amber-500 text-white border-amber-500",
                    Hard: "bg-red-500 text-white border-red-500",
                  };
                  const defaultMap: Record<string, string> = {
                    All: "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400",
                    Easy: "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-400",
                    Medium: "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-amber-400",
                    Hard: "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-400",
                  };
                  return (
                    <button
                      key={d.label}
                      onClick={() => setSelectedDifficulty(d.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${isSelected ? colorMap[d.label] : defaultMap[d.label]
                        }`}
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Topic
                </label>
                {selectedTopics.size > 0 && (
                  <button
                    onClick={() => setSelectedTopics(new Set())}
                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
                  >
                    Clear ({selectedTopics.size} selected)
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* "All" chip */}
                <button
                  onClick={() => setSelectedTopics(new Set())}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${selectedTopics.size === 0
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400"
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
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${isSelected
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-500"
                        : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                        }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-1">
              <button
                onClick={handleQuickStart}
                disabled={loading}
                className="w-full px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Starting Interview...
                  </span>
                ) : (
                  "Start Interview"
                )}
              </button>
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm animate-slide-up">
                  {error}
                </div>
              )}
            </div>
            <div className="pt-8 text-sm text-gray-500 dark:text-gray-400">
              <p>Get ready to tackle challenging data structures and algorithms questions</p>
            </div>
          </div>
        </div>

        {/* Recent Interviews Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Recent Interviews
          </h2>
          {loadingInterviews ? (
            <div className="flex justify-center items-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : recentInterviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No recent interviews yet</p>
              <p className="text-sm mt-2">Start your first interview to see it here</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentInterviews.map((interview) => (
                  <button
                    key={interview.interview_id}
                    onClick={() => handleResumeInterview(interview.session_id)}
                    className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-left border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Interview #{interview.interview_id}
                      </h3>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-medium">
                      Click to resume →
                    </p>
                  </button>
                ))}
              </div>
              <div className="text-center mt-8">
                <button
                  onClick={handleGoToProfile}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200 underline underline-offset-4 hover:underline-offset-2"
                >
                  Show More ...
                </button>
              </div>
            </>
          )}
        </div>
      </div>


      <PreInterviewForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        loading={loading}
        initialData={lastCandidateInfo}
      />
    </div >
  );
}