"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { startInterviewWithForm, getRecentInterviews, getLastInterviewInfo } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { Interview, CandidateInfo } from "@/lib/types";
import { PreInterviewForm } from "@/components/PreInterviewForm";
import { Clock, User } from "lucide-react";

export default function Home() {
  const router = useRouter();
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
      setRecentInterviews(response.interviews);
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

  const handleStartInterview = () => {
    setShowForm(true);
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
          <div className="text-center space-y-8 max-w-2xl animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
                AI Mock DSA Interviewer
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
                Practice FAANG-style DSA interviews with AI
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none"
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