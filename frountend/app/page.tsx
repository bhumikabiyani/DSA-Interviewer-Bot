"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { startBackground } from "@/lib/api";
import { useChatStore } from "@/lib/store";
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setInitialQuestion, reset } = useChatStore();
  const handleStartInterview = async () => {
    setLoading(true);
    setError(null);
    reset();
    try {
      const response = await startBackground();
      router.push(`/background/${response.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start background session");
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
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
    </div>
  );
}