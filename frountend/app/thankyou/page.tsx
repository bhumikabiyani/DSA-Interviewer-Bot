"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-2xl animate-fade-in">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Interview Complete!
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Thank you for participating in the mock DSA interview
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-gray-700 dark:text-gray-300">
              Great job working through the problem! Keep practicing to improve your skills.
            </p>
            
            <button
              onClick={() => router.push("/")}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start New Interview
            </button>
          </div>

          <div className="pt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Continue practicing to master data structures and algorithms</p>
          </div>
        </div>
      </div>
    </div>
  );
}