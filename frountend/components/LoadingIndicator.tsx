"use client";

export function LoadingIndicator() {
  return (
    <div className="flex justify-start animate-slide-up">
      <div className="max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Interviewer is typing
            </span>
            <div className="flex gap-1 ml-1">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}